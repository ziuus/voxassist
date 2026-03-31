import IORedis from "ioredis";
import { Queue } from "bullmq";
import { getRuntimeConfig } from "./env";

export const RECORDING_QUEUE_NAME = "recordings";

type RecordingJobName = "transcribe" | "report";

type RecordingJobPayload = {
  recordingId: string;
};

const globalForQueue = globalThis as unknown as {
  redis?: IORedis;
  recordingQueue?: Queue<RecordingJobPayload>;
};

let loggedMissingRedis = false;

function isQueueConfigured(): boolean {
  const config = getRuntimeConfig();
  return config.jobQueueEnabled && Boolean(config.redisUrl);
}

function getRedisConnection(): IORedis | null {
  if (!isQueueConfigured()) {
    if (getRuntimeConfig().jobQueueEnabled && !loggedMissingRedis) {
      // eslint-disable-next-line no-console
      console.error(
        "ENABLE_JOB_QUEUE is true, but REDIS_URL is missing. Queueing is disabled."
      );
      loggedMissingRedis = true;
    }
    return null;
  }

  if (!globalForQueue.redis) {
    const redisUrl = getRuntimeConfig().redisUrl;
    if (!redisUrl) {
      if (!loggedMissingRedis) {
        // eslint-disable-next-line no-console
        console.error(
          "ENABLE_JOB_QUEUE is true, but REDIS_URL is missing. Queueing is disabled."
        );
        loggedMissingRedis = true;
      }
      return null;
    }

    globalForQueue.redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  return globalForQueue.redis;
}

function getRecordingQueue(): Queue<RecordingJobPayload> | null {
  const redis = getRedisConnection();
  if (!redis) {
    return null;
  }

  if (!globalForQueue.recordingQueue) {
    globalForQueue.recordingQueue = new Queue<RecordingJobPayload>(
      RECORDING_QUEUE_NAME,
      {
        connection: redis,
      }
    );
  }

  return globalForQueue.recordingQueue;
}

export function shouldUseJobQueue(): boolean {
  return isQueueConfigured();
}

export async function enqueueRecordingJob(
  name: RecordingJobName,
  payload: RecordingJobPayload
): Promise<boolean> {
  const queue = getRecordingQueue();
  if (!queue) {
    return false;
  }

  await queue.add(name, payload, {
    jobId: `${name}:${payload.recordingId}`,
    removeOnComplete: 100,
    removeOnFail: 200,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  });

  return true;
}
