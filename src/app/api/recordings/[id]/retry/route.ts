import { NextRequest, NextResponse } from "next/server";
import { getRecordingById, saveRecording } from "@/lib/storage";
import { enqueueRecordingJob, shouldUseJobQueue } from "@/lib/queue";
import { processReportJob, processTranscriptionJob } from "@/lib/recordingJobs";

export const runtime = "nodejs";

type RetryStep = "auto" | "transcribe" | "report";

function resolveRetryStep(step: RetryStep, recording: Awaited<ReturnType<typeof getRecordingById>>) {
  if (!recording) return null;

  if (step === "transcribe") {
    return recording.audioFileName || recording.audioStorageKey ? "transcribe" : null;
  }

  if (step === "report") {
    return recording.transcript ? "report" : null;
  }

  if (!recording.transcript && (recording.audioFileName || recording.audioStorageKey)) {
    return "transcribe";
  }

  if (recording.transcript) {
    return "report";
  }

  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recording = await getRecordingById(id);

  if (!recording) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as { step?: RetryStep };
  const desired = body.step ?? "auto";

  const step = resolveRetryStep(desired, recording);
  if (!step) {
    return NextResponse.json(
      { error: "Unable to resolve retry step for this recording" },
      { status: 400 }
    );
  }

  const inProgress = {
    ...recording,
    status: step === "transcribe" ? ("transcribing" as const) : ("generating_report" as const),
    errorMessage: undefined,
    updatedAt: new Date().toISOString(),
  };

  await saveRecording(inProgress);

  if (shouldUseJobQueue()) {
    await enqueueRecordingJob(step, { recordingId: id });
    return NextResponse.json({ ...inProgress, queued: true }, { status: 202 });
  }

  try {
    if (step === "transcribe") {
      await processTranscriptionJob(id);
    } else {
      await processReportJob(id);
    }

    const latest = await getRecordingById(id);
    return NextResponse.json(latest ?? inProgress);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Retry failed",
      },
      { status: 500 }
    );
  }
}
