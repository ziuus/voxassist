import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getRecordingById } from "@/lib/storage";
import { getAudioPlaybackUrl, getAudioStorageModeForDebug } from "@/lib/audioStorage";

export const runtime = "nodejs";

const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

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
  if (!audioStorageKey) {
    return NextResponse.json({ error: "No audio file available" }, { status: 404 });
  }

  if (getAudioStorageModeForDebug() === "local") {
    const localPath = path.join(LOCAL_UPLOADS_DIR, path.basename(audioStorageKey));

    try {
      const audioBuffer = await fs.readFile(localPath);
      const contentType = recording.audioMimeType ?? "audio/webm";

      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=60",
        },
      });
    } catch {
      return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
    }
  }

  const signedPlaybackUrl = await getAudioPlaybackUrl(id, audioStorageKey);
  return NextResponse.redirect(signedPlaybackUrl, { status: 307 });
}
