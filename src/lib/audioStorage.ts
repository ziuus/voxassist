import fs from "fs/promises";
import path from "path";
import os from "os";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getRuntimeConfig } from "./env";

const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");
const PRESIGNED_URL_TTL_SECONDS = 60 * 30;

type StorageMode = "local" | "s3";

interface StoredAudio {
  audioFileName: string;
  audioStorageKey: string;
  audioMimeType?: string;
}

interface TranscriptionFile {
  filePath: string;
  cleanup: () => Promise<void>;
}

let _s3Client: S3Client | null = null;

function getStorageMode(): StorageMode {
  return getRuntimeConfig().audioStorageMode;
}

function getS3Config() {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_S3_REGION;
  if (!bucket || !region) {
    throw new Error(
      "S3 storage is enabled but AWS_S3_BUCKET or AWS_S3_REGION is missing"
    );
  }

  return {
    bucket,
    region,
    endpoint: process.env.AWS_S3_ENDPOINT,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

function getS3Client(): S3Client {
  if (_s3Client) {
    return _s3Client;
  }

  const config = getS3Config();
  _s3Client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === "true",
    credentials:
      config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        : undefined,
  });

  return _s3Client;
}

function getAudioStorageKey(recordingId: string, fileName: string): string {
  return `recordings/${recordingId}/${fileName}`;
}

function getExtension(file: File): string {
  if (file.name.includes(".")) {
    return path.extname(file.name).toLowerCase();
  }

  if (file.type === "audio/mpeg") return ".mp3";
  if (file.type === "audio/wav") return ".wav";
  if (file.type === "audio/mp4" || file.type === "audio/m4a") return ".m4a";
  if (file.type === "audio/ogg") return ".ogg";
  if (file.type === "audio/flac") return ".flac";
  return ".webm";
}

export async function saveAudioFile(
  recordingId: string,
  audioFile: File
): Promise<StoredAudio> {
  const ext = getExtension(audioFile);
  const audioFileName = `${recordingId}${ext}`;
  const audioStorageKey = getAudioStorageKey(recordingId, audioFileName);
  const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
  const mode = getStorageMode();

  if (mode === "local") {
    await fs.mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
    await fs.writeFile(path.join(LOCAL_UPLOADS_DIR, audioFileName), audioBuffer);

    return {
      audioFileName,
      audioStorageKey,
      audioMimeType: audioFile.type || undefined,
    };
  }

  const s3 = getS3Client();
  const { bucket } = getS3Config();

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: audioStorageKey,
      Body: audioBuffer,
      ContentType: audioFile.type || "application/octet-stream",
    })
  );

  return {
    audioFileName,
    audioStorageKey,
    audioMimeType: audioFile.type || undefined,
  };
}

export async function deleteAudioFile(audioStorageKey?: string): Promise<void> {
  if (!audioStorageKey) return;

  const mode = getStorageMode();
  if (mode === "local") {
    const localPath = path.join(LOCAL_UPLOADS_DIR, path.basename(audioStorageKey));
    try {
      await fs.unlink(localPath);
    } catch {
      // Ignore missing local files during cleanup.
    }
    return;
  }

  const s3 = getS3Client();
  const { bucket } = getS3Config();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: audioStorageKey,
    })
  );
}

export async function getAudioPlaybackUrl(
  recordingId: string,
  audioStorageKey: string
): Promise<string> {
  const mode = getStorageMode();

  if (mode === "local") {
    return `/api/recordings/${recordingId}/audio`;
  }

  const s3 = getS3Client();
  const { bucket } = getS3Config();

  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: audioStorageKey,
    }),
    { expiresIn: PRESIGNED_URL_TTL_SECONDS }
  );
}

export async function getAudioPathForTranscription(
  audioStorageKey: string
): Promise<TranscriptionFile> {
  const mode = getStorageMode();

  if (mode === "local") {
    return {
      filePath: path.join(LOCAL_UPLOADS_DIR, path.basename(audioStorageKey)),
      cleanup: async () => {
        // Local mode does not create temporary files.
      },
    };
  }

  const s3 = getS3Client();
  const { bucket } = getS3Config();
  const object = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: audioStorageKey,
    })
  );

  const bytes = await object.Body?.transformToByteArray();
  if (!bytes) {
    throw new Error("Unable to download audio file from S3");
  }

  const tempPath = path.join(
    os.tmpdir(),
    `voxassist-${Date.now()}-${path.basename(audioStorageKey)}`
  );
  await fs.writeFile(tempPath, Buffer.from(bytes));

  return {
    filePath: tempPath,
    cleanup: async () => {
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors for temp files.
      }
    },
  };
}

export function getAudioStorageModeForDebug(): StorageMode {
  return getStorageMode();
}
