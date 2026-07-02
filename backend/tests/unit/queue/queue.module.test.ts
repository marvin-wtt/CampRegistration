import { afterEach, describe, expect, it } from 'vitest';
import { JobScheduler } from '#core/scheduler/JobScheduler';
import { QueueModule } from '#app/queue/queue.module';

describe('QueueModule.registerJobs', () => {
  let scheduler: JobScheduler;

  afterEach(() => {
    scheduler?.stop();
  });

  it('schedules a running queue-job-cleanup job', () => {
    scheduler = new JobScheduler();

    new QueueModule().registerJobs(scheduler);

    expect(scheduler.findJob('queue-job-cleanup')?.isRunning()).toBeTruthy();
  });
});
