import fs from "fs";
import path from "path";
import { Recording, MedicalReport } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const RECORDINGS_FILE = path.join(DATA_DIR, "recordings.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readRecordings(): Recording[] {
  ensureDir();
  try {
    const raw = fs.readFileSync(RECORDINGS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeRecordings(recordings: Recording[]) {
  ensureDir();
  fs.writeFileSync(RECORDINGS_FILE, JSON.stringify(recordings, null, 2), "utf-8");
}

function generateId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const supabaseKeys = ["externalId", "patientId"];

function cleanSupabaseKeys(r: any): Recording {
  const clean: any = { ...r };
  for (const key of supabaseKeys) {
    delete clean[key];
  }
  if (!clean.id) clean.id = generateId();
  return clean as Recording;
}

export function getAllRecordings(): Recording[] {
  const recs = readRecordings();
  // Seed data if empty
  if (recs.length === 0) {
    seedDemoData();
    return readRecordings();
  }
  return recs;
}

export function getRecordingById(id: string): Recording | null {
  const recordings = readRecordings();
  return recordings.find(r => r.id === id) || null;
}

export async function searchRecordings(params: {
  patientName?: string;
  doctorName?: string;
  query?: string;
  limit?: number;
}): Promise<Recording[]> {
  let recordings = readRecordings();

  if (params.patientName) {
    const q = params.patientName.toLowerCase();
    recordings = recordings.filter(r => r.patientName?.toLowerCase().includes(q));
  }
  if (params.doctorName) {
    const q = params.doctorName.toLowerCase();
    recordings = recordings.filter(r => r.doctorName?.toLowerCase().includes(q));
  }
  if (params.query) {
    const q = params.query.toLowerCase();
    recordings = recordings.filter(
      r =>
        r.title?.toLowerCase().includes(q) ||
        r.transcript?.toLowerCase().includes(q) ||
        (r.report && JSON.stringify(r.report).toLowerCase().includes(q))
    );
  }

  const limit = params.limit || 10;
  return recordings.slice(0, limit);
}

export async function createRecording(data: {
  title: string;
  patientName?: string;
  doctorName?: string;
}): Promise<Recording> {
  const recordings = readRecordings();
  const now = new Date().toISOString();
  const recording: Recording = {
    id: generateId(),
    userId: "demo-user",
    title: data.title,
    patientName: data.patientName || undefined,
    doctorName: data.doctorName || undefined,
    date: now,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  recordings.push(recording);
  writeRecordings(recordings);
  return recording;
}

export async function createRecordingWithId(data: {
  externalId: string;
  title: string;
  patientName?: string;
  doctorName?: string;
  userId?: string;
}): Promise<Recording> {
  const recordings = readRecordings();
  const now = new Date().toISOString();
  const recording: Recording = {
    id: data.externalId,
    userId: data.userId || "demo-user",
    title: data.title,
    patientName: data.patientName || undefined,
    doctorName: data.doctorName || undefined,
    date: now,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  recordings.push(recording);
  writeRecordings(recordings);
  return recording;
}

export async function updateRecording(
  id: string,
  updates: Partial<Recording>
): Promise<Recording | null> {
  const recordings = readRecordings();
  const index = recordings.findIndex(r => r.id === id);
  if (index === -1) {
    // Create a new recording with this data
    const now = new Date().toISOString();
    const recording: Recording = {
      id,
      userId: "demo-user",
      title: updates.title || "Untitled Recording",
      patientName: updates.patientName || undefined,
      doctorName: updates.doctorName || undefined,
      date: updates.date || now,
      status: updates.status || "pending",
      transcript: updates.transcript || undefined,
      report: updates.report || undefined,
      errorMessage: updates.errorMessage || undefined,
      duration: updates.duration || undefined,
      audioFileName: updates.audioFileName || undefined,
      audioStorageKey: updates.audioStorageKey || undefined,
      audioMimeType: updates.audioMimeType || undefined,
      createdAt: now,
      updatedAt: now,
    };
    recordings.push(recording);
    writeRecordings(recordings);
    return recording;
  }

  recordings[index] = {
    ...recordings[index],
    ...updates,
    id: recordings[index].id,
    updatedAt: new Date().toISOString(),
  };
  writeRecordings(recordings);
  return recordings[index];
}

export async function deleteRecording(id: string): Promise<boolean> {
  const recordings = readRecordings();
  const index = recordings.findIndex(r => r.id === id);
  if (index === -1) return false;
  recordings.splice(index, 1);
  writeRecordings(recordings);
  return true;
}

/** Seed demo data if storage is empty */
function seedDemoData() {
  const now = new Date();
  const sampleRecordings: Recording[] = [
    {
      id: generateId(),
      userId: "demo-user",
      title: "Consultation — Headache & Dizziness",
      patientName: "Priya Sharma",
      doctorName: "Dr. Mehta",
      date: new Date(now.getTime() - 86400000).toISOString(),
      status: "completed",
      duration: 420,
      transcript: "Doctor: Good morning, how can I help you today?\nPatient: I've been having headaches for the past week, especially in the morning.\nDoctor: Any other symptoms like nausea or vision problems?\nPatient: Sometimes I feel dizzy when I stand up quickly.\nDoctor: Let me check your blood pressure.",
      report: {
        date: new Date(now.getTime() - 86400000).toISOString().split("T")[0],
        chiefComplaint: "Morning headaches with occasional dizziness for one week",
        symptoms: ["Headache (morning)", "Dizziness on standing"],
        medicalHistory: "No significant past medical history reported",
        examination: "Blood pressure assessment recommended",
        assessment: "Possible orthostatic hypotension or tension headaches",
        diagnosis: "Headache, unspecified (R51)",
        treatmentPlan: "Monitor blood pressure, maintain hydration, follow-up in one week",
        medications: [],
        followUp: "One week",
        billingCodes: {
          icd10: [{ code: "R51", description: "Headache" }],
          cpt: [{ code: "99213", description: "Office visit, established patient, low complexity" }],
        },
        additionalNotes: "Patient advised to keep headache diary",
      },
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      id: generateId(),
      userId: "demo-user",
      title: "Follow-up — Blood Pressure Review",
      patientName: "Priya Sharma",
      doctorName: "Dr. Mehta",
      date: new Date(now.getTime() - 2 * 86400000).toISOString(),
      status: "completed",
      duration: 300,
      transcript: "Doctor: How have the headaches been?\nPatient: Much better since I started drinking more water.\nDoctor: Great. Let me take your blood pressure.\n...",
      report: {
        date: new Date(now.getTime() - 2 * 86400000).toISOString().split("T")[0],
        chiefComplaint: "Follow-up on headache and blood pressure",
        symptoms: ["Headache improved"],
        medicalHistory: "Previous consultation for headaches one week ago",
        examination: "Blood pressure: 120/80 mmHg — normal",
        assessment: "Symptoms resolved with hydration and rest",
        diagnosis: "Follow-up, resolved (Z09)",
        treatmentPlan: "Continue healthy habits, no further follow-up needed",
        medications: [],
        followUp: "As needed",
        billingCodes: {
          icd10: [{ code: "Z09", description: "Follow-up examination" }],
          cpt: [{ code: "99211", description: "Office visit, minimal problem" }],
        },
        additionalNotes: "Patient discharged",
      },
      createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
  ];

  writeRecordings(sampleRecordings);
}
