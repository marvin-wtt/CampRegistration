import { removeExpiredTokens } from '#jobs/tokens.job';
import {
  deleteTemporaryFiles,
  deleteUnassignedFiles,
  deleteUnusedFiles,
} from '#jobs/files.job';
import { deleteOldQueueJobs } from '#jobs/queue.job';
import { type CronOptions, Cron, scheduledJobs } from 'croner';
import {
  errorHandler,
  completionHandler,
  executionHandler,
  protectionHandler,
  terminationHandler,
} from './handler.js';

const startJobs = () => {
  scheduleJob('expired-token-cleanup', '0 3 * * *', removeExpiredTokens);
  scheduleJob('tmp-file-cleanup', '0 4 * * *', deleteTemporaryFiles);
  scheduleJob('unused-file-cleanup', '15 4 * * *', deleteUnusedFiles);
  scheduleJob('unassigned-file-cleanup', '30 4 * * *', deleteUnassignedFiles);
  scheduleJob('queue-job-cleanup', '45 4 * * *', deleteOldQueueJobs);
};

const scheduleJob = (
  name: string,
  pattern: string,
  fn: () => void | Promise<void>,
  options: CronOptions = {},
) => {
  if (findJob(name)) {
    return;
  }

  const jobOptions: CronOptions = {
    ...options,
    name,
    protect: protectionHandler,
    catch: errorHandler,
  };

  // Create the job
  const job = new Cron(pattern, jobOptions, runJob(fn));

  // Check if job is scheduled for execution
  if (!job.nextRun() && !job.previousRun()) {
    return;
  }
};

const runJob = (
  fn: () => void | Promise<void>,
): ((job: Cron) => Promise<void>) => {
  return async (job: Cron) => {
    executionHandler(job);

    await fn();

    completionHandler(job);

    if (!job.nextRun()) {
      terminationHandler('No further executions scheduled', job);
    }
  };
};

const stopJobs = () => {
  for (const job of scheduledJobs) {
    job.stop();
  }

  // Clear all jobs
  scheduledJobs.length = 0;
};

const findJob = (name: string): Cron | undefined => {
  return scheduledJobs.find((job) => job.name === name);
};

export { startJobs, stopJobs, findJob };
