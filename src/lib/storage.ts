import fs from "fs";
import path from "path";
import { Recording } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const RECORDINGS_FILE = path.join(DATA_DIR, "recordings.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

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

export function getAllRecordings(): Recording[] {
  const recordings = readRecordings();
  return recordings.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getRecordingById(id: string): Recording | null {
  const recordings = readRecordings();
  return recordings.find((r) => r.id === id) ?? null;
}

export function saveRecording(recording: Recording): void {
  const recordings = readRecordings();
  const index = recordings.findIndex((r) => r.id === recording.id);
  if (index >= 0) {
    recordings[index] = recording;
  } else {
    recordings.push(recording);
  }
  writeRecordings(recordings);
}

export function deleteRecording(id: string): boolean {
  const recordings = readRecordings();
  const index = recordings.findIndex((r) => r.id === id);
  if (index < 0) return false;
  const [removed] = recordings.splice(index, 1);
  if (removed.audioFileName) {
    const audioPath = path.join(UPLOADS_DIR, removed.audioFileName);
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
  }
  writeRecordings(recordings);
  return true;
}
