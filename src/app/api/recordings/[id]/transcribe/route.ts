import { NextRequest, NextResponse } from "next/server";
import { getRecordingById, saveRecording } from "@/lib/storage";
import { enqueueRecordingJob, shouldUseJobQueue } from "@/lib/queue";
import { processTranscriptionJob } from "@/lib/recordingJobs";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recording = await getRecordingById(id);

  if (!recording) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  const audioStorageKey = recording.audioStorageKey ?? recording.audioFileName;
  if (!audioStorageKey) {
    return NextResponse.json(
      { error: "No audio file associated with this recording" },
      { status: 400 }
    );
  }

  const inProgress = {
    ...recording,
    status: "transcribing" as const,
    errorMessage: undefined,
    updatedAt: new Date().toISOString(),
  };

  await saveRecording(inProgress);

  if (shouldUseJobQueue()) {
    await enqueueRecordingJob("transcribe", { recordingId: id });
    return NextResponse.json(
      {
        ...inProgress,
        queued: true,
      },
      { status: 202 }
    );
  }

  try {
    await processTranscriptionJob(id);
    const updated = await getRecordingById(id);
    return NextResponse.json(updated ?? inProgress);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Transcription failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
