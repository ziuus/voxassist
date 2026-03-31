import fs from "fs/promises";
import path from "path";
import { getPrismaClient } from "../src/lib/prisma";

type LegacyMedicalReport = {
  patientName?: string;
  doctorName?: string;
  date?: string;
  chiefComplaint?: string;
  symptoms?: string[];
  medicalHistory?: string;
  examination?: string;
  assessment?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  medications?: string[];
  followUp?: string;
  additionalNotes?: string;
};

type LegacyRecording = {
  id: string;
  title: string;
  patientName?: string;
  doctorName?: string;
  date: string;
  status:
    | "pending"
    | "transcribing"
    | "transcribed"
    | "generating_report"
    | "completed"
    | "error";
  audioFileName?: string;
  audioStorageKey?: string;
  audioMimeType?: string;
  duration?: number;
  transcript?: string;
  report?: LegacyMedicalReport;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};

const RECORDINGS_FILE = path.join(process.cwd(), "data", "recordings.json");

function normalizeDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function toRecordingStatus(status: LegacyRecording["status"]): LegacyRecording["status"] {
  switch (status) {
    case "pending":
      return "pending";
    case "transcribing":
      return "transcribing";
    case "transcribed":
      return "transcribed";
    case "generating_report":
      return "generating_report";
    case "completed":
      return "completed";
    case "error":
      return "error";
    default:
      return "pending";
  }
}

async function run() {
  const prisma = getPrismaClient();
  if (!prisma) {
    console.error("DATABASE_URL is required to run this migration.");
    process.exitCode = 1;
    return;
  }

  let parsed: LegacyRecording[] = [];

  try {
    const raw = await fs.readFile(RECORDINGS_FILE, "utf-8");
    parsed = JSON.parse(raw) as LegacyRecording[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.log("No local recordings found at data/recordings.json. Nothing to migrate.");
      return;
    }
    throw error;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    console.log("Local recordings file is empty. Nothing to migrate.");
    return;
  }

  let migrated = 0;

  for (const item of parsed) {
    if (!item.id || !item.title || !item.createdAt) {
      console.warn(`Skipping invalid recording entry: ${JSON.stringify(item)}`);
      continue;
    }

    const createdAt = normalizeDate(item.createdAt, new Date());
    const updatedAt = normalizeDate(item.updatedAt, createdAt);
    const date = normalizeDate(item.date, createdAt);

    await prisma.recording.upsert({
      where: {
        externalId: item.id,
      },
      update: {
        title: item.title,
        patientName: item.patientName,
        doctorName: item.doctorName,
        date,
        status: toRecordingStatus(item.status),
        audioFileName: item.audioFileName,
        audioStorageKey: item.audioStorageKey ?? item.audioFileName,
        audioMimeType: item.audioMimeType,
        duration: item.duration,
        transcript: item.transcript,
        report: (item.report ?? undefined) as object | undefined,
        errorMessage: item.errorMessage,
        updatedAt,
      },
      create: {
        externalId: item.id,
        title: item.title,
        patientName: item.patientName,
        doctorName: item.doctorName,
        date,
        status: toRecordingStatus(item.status),
        audioFileName: item.audioFileName,
        audioStorageKey: item.audioStorageKey ?? item.audioFileName,
        audioMimeType: item.audioMimeType,
        duration: item.duration,
        transcript: item.transcript,
        report: (item.report ?? undefined) as object | undefined,
        errorMessage: item.errorMessage,
        createdAt,
        updatedAt,
      },
    });

    migrated += 1;
  }

  console.log(`Migration complete. Upserted ${migrated} recordings into MongoDB.`);
}

run()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.$disconnect();
    }
  });
