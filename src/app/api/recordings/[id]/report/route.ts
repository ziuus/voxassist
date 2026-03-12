import { NextRequest, NextResponse } from "next/server";
import { getRecordingById, saveRecording } from "@/lib/storage";
import { generateMedicalReport } from "@/lib/openai";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recording = getRecordingById(id);

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

  // Update status to generating_report
  saveRecording({
    ...recording,
    status: "generating_report",
    updatedAt: new Date().toISOString(),
  });

  try {
    const report = await generateMedicalReport(
      recording.transcript,
      recording.patientName,
      recording.doctorName
    );

    const updated = {
      ...recording,
      report,
      status: "completed" as const,
      updatedAt: new Date().toISOString(),
    };
    saveRecording(updated);

    return NextResponse.json(updated);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Report generation failed";
    saveRecording({
      ...recording,
      status: "error",
      errorMessage,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
