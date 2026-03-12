import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getRecordingById, saveRecording, UPLOADS_DIR } from "@/lib/storage";
import { transcribeAudio } from "@/lib/openai";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recording = getRecordingById(id);

  if (!recording) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  if (!recording.audioFileName) {
    return NextResponse.json(
      { error: "No audio file associated with this recording" },
      { status: 400 }
    );
  }

  const audioPath = path.join(UPLOADS_DIR, recording.audioFileName);

  // Update status to transcribing
  saveRecording({
    ...recording,
    status: "transcribing",
    updatedAt: new Date().toISOString(),
  });

  try {
    const transcript = await transcribeAudio(audioPath);

    const updated = {
      ...recording,
      transcript,
      status: "transcribed" as const,
      updatedAt: new Date().toISOString(),
    };
    saveRecording(updated);

    return NextResponse.json(updated);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Transcription failed";
    saveRecording({
      ...recording,
      status: "error",
      errorMessage,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
