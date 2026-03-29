import { NextRequest, NextResponse } from "next/server";
import {
  getRecordingById,
  deleteRecording,
  saveRecording,
} from "@/lib/storage";
import { deleteAudioFile, getAudioPlaybackUrl } from "@/lib/audioStorage";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recording = await getRecordingById(id);
  if (!recording) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  const audioStorageKey = recording.audioStorageKey ?? recording.audioFileName;
  return NextResponse.json({
    ...recording,
    audioStorageKey,
    audioPlaybackUrl: audioStorageKey
      ? await getAudioPlaybackUrl(recording.id, audioStorageKey)
      : undefined,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recording = await getRecordingById(id);
  if (!recording) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<typeof recording>;
  const updated = {
    ...recording,
    ...body,
    id: recording.id,
    updatedAt: new Date().toISOString(),
  };
  await saveRecording(updated);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await getRecordingById(id);
  if (!existing) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  await deleteAudioFile(existing.audioStorageKey ?? existing.audioFileName);

  const deleted = await deleteRecording(id);
  if (!deleted) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
