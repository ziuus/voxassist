import { generateMedicalReport, transcribeAudio } from "@/lib/openai";
import { getAudioPathForTranscription } from "@/lib/audioStorage";
import { getRecordingById, saveRecording } from "@/lib/storage";
import { getPrismaClient } from "./prisma";

export async function processTranscriptionJob(recordingId: string): Promise<void> {
  const recording = await getRecordingById(recordingId);
  if (!recording) {
    throw new Error(`Recording ${recordingId} not found`);
  }

  const audioStorageKey = recording.audioStorageKey ?? recording.audioFileName;
  if (!audioStorageKey) {
    throw new Error(`Recording ${recordingId} has no audio file`);
  }

  const source = await getAudioPathForTranscription(audioStorageKey);

  try {
    const transcript = await transcribeAudio(source.filePath);

    await saveRecording({
      ...recording,
      transcript,
      status: "transcribed",
      errorMessage: undefined,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcription failed";
    await saveRecording({
      ...recording,
      status: "error",
      errorMessage: message,
      updatedAt: new Date().toISOString(),
    });
    throw error;
  } finally {
    await source.cleanup();
  }
}

export async function processReportJob(recordingId: string): Promise<void> {
  const prisma = getPrismaClient();
  const recording = await getRecordingById(recordingId);
  if (!recording) {
    throw new Error(`Recording ${recordingId} not found`);
  }

  if (!recording.transcript) {
    throw new Error(`Recording ${recordingId} has no transcript`);
  }

  // Fetch user's default template or global default
  let templateFields: string[] | undefined;
  if (prisma && recording.userId) {
    const template = await prisma.reportTemplate.findFirst({
      where: {
        OR: [
          { userId: recording.userId, isDefault: true },
          { userId: null, isDefault: true }
        ]
      },
      orderBy: { userId: 'desc' } // Prioritize user-specific template
    });
    
    if (template) {
      templateFields = template.fields;
    }
  }

  try {
    const report = await generateMedicalReport(
      recording.transcript,
      recording.patientName,
      recording.doctorName,
      recording.medicalSpecialty,
      templateFields
    );

    await saveRecording({
      ...recording,
      report,
      status: "completed",
      errorMessage: undefined,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report generation failed";
    await saveRecording({
      ...recording,
      status: "error",
      errorMessage: message,
      updatedAt: new Date().toISOString(),
    });
    throw error;
  }
}
