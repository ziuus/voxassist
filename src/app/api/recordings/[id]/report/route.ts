import { NextRequest, NextResponse } from "next/server";
import { getRecordingById, saveRecording } from "@/lib/storage";
import { enqueueRecordingJob, shouldUseJobQueue } from "@/lib/queue";
import { processReportJob } from "@/lib/recordingJobs";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recording = await getRecordingById(id);

  if (!recording) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  if (!recording.transcript) {
    return NextResponse.json(
      {
        error:
          "No transcript available. Please transcribe the recording first.",
      },
      { status: 400 }
    );
  }

  const inProgress = {
    ...recording,
    status: "generating_report" as const,
    errorMessage: undefined,
    updatedAt: new Date().toISOString(),
  };

  await saveRecording(inProgress);

  if (shouldUseJobQueue()) {
    await enqueueRecordingJob("report", { recordingId: id });
    return NextResponse.json(
      {
        ...inProgress,
        queued: true,
      },
      { status: 202 }
    );
  }

  try {
    await processReportJob(id);
    const updated = await getRecordingById(id);
    return NextResponse.json(updated ?? inProgress);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Report generation failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
