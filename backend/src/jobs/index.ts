import { removeExpiredTokens } from 'jobs/tokens.job';
import { deleteTemporaryFiles, deleteUnusedFiles } from 'jobs/files.job';
import { CronOptions, Cron } from 'croner';
import {
  errorHandler,
  completionHandler,
  executionHandler,
  protectionHandler,
  terminationHandler,
} from './handler';

const jobs: Cron[] = [];

const startJobs = () => {
  scheduleJob('expired-token-cleanup', '0 3 * * *', removeExpiredTokens);
  scheduleJob('tmp-file-cleanup', '0 4 * * *', deleteTemporaryFiles);
  scheduleJob('unused-file-cleanup', '30 4 * * *', deleteUnusedFiles);
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
  const job = Cron(pattern, jobOptions, runJob(fn));

  // Check if job is scheduled for execution
  if (!job.nextRun() && !job.previousRun()) {
    return;
  }

  jobs.push(job);
};

const runJob = (
  fn: () => void | Promise<void>,
): ((job: Cron) => Promise<void>) => {
  return async (job: Cron) => {
    executionHandler(job);

    await fn();

    completionHandler(job);

    if (!job.nextRun()) {
      terminationHandler('No further executes scheduled', job);
      jobs.splice(jobs.indexOf(job), 1);
    }
  };
};

const stopJobs = () => {
  for (const job of jobs) {
    if (!job.isStopped()) {
      job.stop();
    }
  }
};

const findJob = (name: string): Cron | undefined => {
  return jobs.find((job) => job.name === name);
};

export { startJobs, stopJobs, findJob };
