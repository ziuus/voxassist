import IORedis from "ioredis";
import { Worker } from "bullmq";
import { processReportJob, processTranscriptionJob } from "@/lib/recordingJobs";
import { RECORDING_QUEUE_NAME } from "@/lib/queue";
import { getRuntimeConfig } from "@/lib/env";

const runtimeConfig = getRuntimeConfig();
if (!runtimeConfig.redisUrl) {
  console.error("REDIS_URL is required to start recording worker");
  process.exit(1);
}

const connection = new IORedis(runtimeConfig.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const worker = new Worker(
  RECORDING_QUEUE_NAME,
  async (job) => {
    if (job.name === "transcribe") {
      await processTranscriptionJob(job.data.recordingId);
      return;
    }

    if (job.name === "report") {
      await processReportJob(job.data.recordingId);
      return;
    }

    throw new Error(`Unsupported job type: ${job.name}`);
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`Completed job ${job.id} (${job.name})`);
});

worker.on("failed", (job, error) => {
  console.error(`Failed job ${job?.id} (${job?.name}):`, error.message);
});

console.log("Recording worker is running");
