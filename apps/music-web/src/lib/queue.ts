import { Queue } from "bullmq";
import { redis } from "./redis";

export const processingQueue = new Queue("song-processing", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
  },
});

export async function createJob(payload: {
  jobId: string;
  sourceUrl: string | null;
  fileKey: string | null;
}) {
  await processingQueue.add("process", payload, { jobId: payload.jobId });
}
