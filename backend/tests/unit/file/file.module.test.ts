import { afterEach, describe, expect, it } from 'vitest';
import { JobScheduler } from '#core/scheduler/JobScheduler';
import { FileModule } from '#app/file/file.module';

describe('FileModule.registerJobs', () => {
  let scheduler: JobScheduler;

  afterEach(() => {
    scheduler?.stop();
  });

  it.each([
    'tmp-file-cleanup',
    'unused-file-cleanup',
    'unassigned-file-cleanup',
  ])('schedules a running %s job', (name) => {
    scheduler = new JobScheduler();

    new FileModule().registerJobs(scheduler);

    expect(scheduler.findJob(name)?.isRunning()).toBeTruthy();
  });
});
