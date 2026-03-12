import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { getAllRecordings, saveRecording, UPLOADS_DIR } from "@/lib/storage";
import { Recording } from "@/lib/types";

export async function GET() {
  const recordings = getAllRecordings();
  return NextResponse.json(recordings);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const title = (formData.get("title") as string) ?? "Untitled Recording";
  const patientName = (formData.get("patientName") as string) || undefined;
  const doctorName = (formData.get("doctorName") as string) || undefined;
  const audioFile = formData.get("audio") as File | null;

  const id = uuidv4();
  const now = new Date().toISOString();

  let audioFileName: string | undefined;

  if (audioFile && audioFile.size > 0) {
    const ext = audioFile.name.includes(".")
      ? path.extname(audioFile.name)
      : ".webm";
    audioFileName = `${id}${ext}`;
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(UPLOADS_DIR, audioFileName), audioBuffer);
  }

  const recording: Recording = {
    id,
    title,
    patientName,
    doctorName,
    date: new Date().toISOString().split("T")[0],
    status: "pending",
    audioFileName,
    createdAt: now,
    updatedAt: now,
  };

  saveRecording(recording);

  return NextResponse.json(recording, { status: 201 });
}
