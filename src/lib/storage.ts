import fs from "fs";
import path from "path";
import { Recording } from "./types";
import { getPrismaClient } from "./prisma";
import { getRuntimeConfig } from "./env";

const DATA_DIR = path.join(process.cwd(), "data");
const RECORDINGS_FILE = path.join(DATA_DIR, "recordings.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

type PersistenceMode = "local" | "mongodb";

let loggedMongoFallback = false;
let loggedMongoQueryFailure = false;

function logMongoQueryFailureOnce(error: unknown) {
  if (loggedMongoQueryFailure) return;
  loggedMongoQueryFailure = true;
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(
    `MongoDB query failed. Falling back to local storage. Error: ${message}`
  );
}

function getPersistenceMode(): PersistenceMode {
  const config = getRuntimeConfig();
  if (config.forceLocalStorage) {
    return "local";
  }
  if (config.persistenceMode === "mongodb") {
    if (!config.databaseUrl || !getPrismaClient()) {
      if (!loggedMongoFallback) {
        // eslint-disable-next-line no-console
        console.error(
          "MongoDB persistence was selected, but DATABASE_URL is missing or Prisma failed to initialize. Falling back to local storage."
        );
        loggedMongoFallback = true;
      }
      return "local";
    }
  }

  return config.persistenceMode;
}

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function readRecordings(): Recording[] {
  ensureDirectories();
  if (!fs.existsSync(RECORDINGS_FILE)) {
    return [];
  }
  const raw = fs.readFileSync(RECORDINGS_FILE, "utf-8");
  return JSON.parse(raw) as Recording[];
}

function writeRecordings(recordings: Recording[]): void {
  ensureDirectories();
  fs.writeFileSync(RECORDINGS_FILE, JSON.stringify(recordings, null, 2));
}

function mapMongoRecording(recording: {
  externalId: string;
  title: string;
  patientName: string | null;
  doctorName: string | null;
  date: Date;
  status: string;
  audioFileName: string | null;
  audioStorageKey: string | null;
  audioMimeType: string | null;
  duration: number | null;
  transcript: string | null;
  report: unknown;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Recording {
  return {
    id: recording.externalId,
    title: recording.title,
    patientName: recording.patientName ?? undefined,
    doctorName: recording.doctorName ?? undefined,
    date: recording.date.toISOString().split("T")[0],
    status: recording.status as Recording["status"],
    audioFileName: recording.audioFileName ?? undefined,
    audioStorageKey: recording.audioStorageKey ?? undefined,
    audioMimeType: recording.audioMimeType ?? undefined,
    duration: recording.duration ?? undefined,
    transcript: recording.transcript ?? undefined,
    report: (recording.report as Recording["report"]) ?? undefined,
    errorMessage: recording.errorMessage ?? undefined,
    createdAt: recording.createdAt.toISOString(),
    updatedAt: recording.updatedAt.toISOString(),
  };
}

export async function getAllRecordings(): Promise<Recording[]> {
  if (getPersistenceMode() === "local") {
    const recordings = readRecordings();
    return recordings.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    const recordings = readRecordings();
    return recordings.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  try {
    const recordings = await prisma.recording.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return recordings.map(mapMongoRecording);
  } catch (error) {
    logMongoQueryFailureOnce(error);
    const recordings = readRecordings();
    return recordings.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export async function getRecordingById(id: string): Promise<Recording | null> {
  if (getPersistenceMode() === "local") {
    const recordings = readRecordings();
    return recordings.find((r) => r.id === id) ?? null;
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    const recordings = readRecordings();
    return recordings.find((r) => r.id === id) ?? null;
  }

  try {
    const recording = await prisma.recording.findUnique({
      where: {
        externalId: id,
      },
    });

    return recording ? mapMongoRecording(recording) : null;
  } catch (error) {
    logMongoQueryFailureOnce(error);
    const recordings = readRecordings();
    return recordings.find((r) => r.id === id) ?? null;
  }
}

export async function saveRecording(recording: Recording): Promise<void> {
  if (getPersistenceMode() === "local") {
    const recordings = readRecordings();
    const index = recordings.findIndex((r) => r.id === recording.id);
    if (index >= 0) {
      recordings[index] = recording;
    } else {
      recordings.push(recording);
    }
    writeRecordings(recordings);
    return;
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    const recordings = readRecordings();
    const index = recordings.findIndex((r) => r.id === recording.id);
    if (index >= 0) {
      recordings[index] = recording;
    } else {
      recordings.push(recording);
    }
    writeRecordings(recordings);
    return;
  }

  const date = new Date(recording.date);
  const createdAt = new Date(recording.createdAt);
  const updatedAt = new Date(recording.updatedAt);
  const normalizedPatientName = recording.patientName?.trim();

  let patientId: string | null = null;
  if (normalizedPatientName) {
    const existingPatient = await prisma.patient.findFirst({
      where: {
        fullName: normalizedPatientName,
      },
      select: {
        id: true,
      },
    });

    if (existingPatient) {
      patientId = existingPatient.id;
    } else {
      const createdPatient = await prisma.patient.create({
        data: {
          fullName: normalizedPatientName,
        },
        select: {
          id: true,
        },
      });
      patientId = createdPatient.id;
    }
  }

  try {
    await prisma.recording.upsert({
      where: {
        externalId: recording.id,
      },
      update: {
        title: recording.title,
        patientName: normalizedPatientName,
        doctorName: recording.doctorName,
        date,
        status: recording.status,
        patientId,
        audioFileName: recording.audioFileName,
        audioStorageKey: recording.audioStorageKey,
        audioMimeType: recording.audioMimeType,
        duration: recording.duration,
        transcript: recording.transcript,
        report: recording.report as object | undefined,
        errorMessage: recording.errorMessage,
        updatedAt,
      },
      create: {
        externalId: recording.id,
        title: recording.title,
        patientName: normalizedPatientName,
        doctorName: recording.doctorName,
        date,
        status: recording.status,
        patientId,
        audioFileName: recording.audioFileName,
        audioStorageKey: recording.audioStorageKey,
        audioMimeType: recording.audioMimeType,
        duration: recording.duration,
        transcript: recording.transcript,
        report: recording.report as object | undefined,
        errorMessage: recording.errorMessage,
        createdAt,
        updatedAt,
      },
    });
  } catch (error) {
    logMongoQueryFailureOnce(error);
    const recordings = readRecordings();
    const index = recordings.findIndex((r) => r.id === recording.id);
    if (index >= 0) {
      recordings[index] = recording;
    } else {
      recordings.push(recording);
    }
    writeRecordings(recordings);
  }
}

export async function deleteRecording(id: string): Promise<boolean> {
  if (getPersistenceMode() === "local") {
    const recordings = readRecordings();
    const index = recordings.findIndex((r) => r.id === id);
    if (index < 0) return false;
    recordings.splice(index, 1);
    writeRecordings(recordings);
    return true;
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    const recordings = readRecordings();
    const index = recordings.findIndex((r) => r.id === id);
    if (index < 0) return false;
    recordings.splice(index, 1);
    writeRecordings(recordings);
    return true;
  }

  try {
    const deleted = await prisma.recording.deleteMany({
      where: {
        externalId: id,
      },
    });

    return deleted.count > 0;
  } catch (error) {
    logMongoQueryFailureOnce(error);
    const recordings = readRecordings();
    const index = recordings.findIndex((r) => r.id === id);
    if (index < 0) return false;
    recordings.splice(index, 1);
    writeRecordings(recordings);
    return true;
  }
}
