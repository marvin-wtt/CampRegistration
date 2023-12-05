import { removeExpiredTokens } from "@/jobs/tokens.job";
import { deleteTemporaryFiles, deleteUnusedFiles } from "@/jobs/files.job";
import Cron from "croner";

let jobs: Cron[] = [];

export const startJobs = () => {
  const defaultJobs = [
    removeExpiredTokens,
    deleteUnusedFiles,
    deleteTemporaryFiles,
  ];

  for (const job of defaultJobs) {
    jobs.push(job());
  }
};

export const stopJobs = () => {
  for (const job of jobs) {
    job.stop();
  }

  jobs = [];
};
