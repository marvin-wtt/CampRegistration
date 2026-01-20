import { Cron, scheduledJobs } from 'croner';
import { AppJob } from '#core/base/AppJob';

export function createJob(job: AppJob) {
  return new Cron(
    job.name,
    {
      name: job.name,
      paused: true,
    },
    job.run.bind(job),
  );
}

export function findJob(name: string): Cron | undefined {
  return scheduledJobs.find((job) => job.name === name);
}

export function stopJobs() {
  scheduledJobs.forEach((job) => job.stop());
  scheduledJobs.length = 0;
}
