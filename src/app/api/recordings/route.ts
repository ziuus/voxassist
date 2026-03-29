import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getAllRecordings, saveRecording } from "@/lib/storage";
import { Recording } from "@/lib/types";
import { getAudioPlaybackUrl, saveAudioFile } from "@/lib/audioStorage";

export const runtime = "nodejs";

export async function GET() {
  const recordings = await getAllRecordings();

  const withPlayback = await Promise.all(
    recordings.map(async (recording) => {
      const audioStorageKey = recording.audioStorageKey ?? recording.audioFileName;
      if (!audioStorageKey) {
        return recording;
      }

      return {
        ...recording,
        audioStorageKey,
        audioPlaybackUrl: await getAudioPlaybackUrl(recording.id, audioStorageKey),
      } satisfies Recording;
    })
  );

  return NextResponse.json(withPlayback);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const title = (formData.get("title") as string) ?? "Untitled Recording";
  const patientName = (formData.get("patientName") as string) || undefined;
  const doctorName = (formData.get("doctorName") as string) || undefined;
  const transcript = ((formData.get("transcript") as string) || "").trim();
  const audioFile = formData.get("audio") as File | null;

  const id = uuidv4();
  const now = new Date().toISOString();

  let audioFileName: string | undefined;
  let audioStorageKey: string | undefined;
  let audioMimeType: string | undefined;

  if (audioFile && audioFile.size > 0) {
    const stored = await saveAudioFile(id, audioFile);
    audioFileName = stored.audioFileName;
    audioStorageKey = stored.audioStorageKey;
    audioMimeType = stored.audioMimeType;
  }

  const recording: Recording = {
    id,
    title,
    patientName,
    doctorName,
    date: new Date().toISOString().split("T")[0],
    status: transcript ? "transcribed" : "pending",
    audioFileName,
    audioStorageKey,
    audioMimeType,
    transcript: transcript || undefined,
    createdAt: now,
    updatedAt: now,
  };

  await saveRecording(recording);

  const response: Recording = {
    ...recording,
    audioPlaybackUrl: audioStorageKey
      ? await getAudioPlaybackUrl(recording.id, audioStorageKey)
      : undefined,
  };

  return NextResponse.json(response, { status: 201 });
}
