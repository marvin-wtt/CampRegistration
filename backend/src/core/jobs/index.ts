import { QueueCleanupJob } from '#core/jobs/queue.job';
import { type CronOptions, Cron, scheduledJobs } from 'croner';
import {
  errorHandler,
  completionHandler,
  executionHandler,
  protectionHandler,
  terminationHandler,
} from './handler.js';
import logger from '#core/logger';
import type { AppJob } from '#core/base/AppJob';

export const startJobs = () => {
  scheduledJobs.forEach((job) => job.resume());
};

const scheduleJob = (
  name: string,
  pattern: string,
  fn: () => void | Promise<void>,
  options: CronOptions = {},
) => {
  if (findJob(name)) {
    logger.warn(`Job with name '${name}' already scheduled`);
    return;
  }

  const jobOptions: CronOptions = {
    ...options,
    name,
    paused: true, // TODO Set paused based on if jobs are running
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

export function schedule(job: AppJob) {
  scheduleJob(job.name, job.pattern, job.run.bind(job));
}

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
    job.pause();
  }
};

export const findJob = (name: string): Cron | undefined => {
  return scheduledJobs.find((job) => job.name === name);
};

// TODO Find a better place the schedule this
schedule(new QueueCleanupJob());

export const jobScheduler = {
  schedule,
  find: findJob,
  start: startJobs,
  stop: stopJobs,
};
