import { NextRequest, NextResponse } from "next/server";
import {
  getRecordingById,
  deleteRecording,
  saveRecording,
} from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recording = getRecordingById(id);
  if (!recording) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }
  return NextResponse.json(recording);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recording = getRecordingById(id);
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
  saveRecording(updated);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteRecording(id);
  if (!deleted) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
