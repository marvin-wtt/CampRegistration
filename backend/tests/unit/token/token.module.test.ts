import { afterEach, describe, expect, it } from 'vitest';
import { JobScheduler } from '#core/scheduler/JobScheduler';
import { TokenModule } from '#app/token/token.module';

describe('TokenModule.registerJobs', () => {
  let scheduler: JobScheduler;

  afterEach(() => {
    scheduler?.stop();
  });

  it('schedules a running expired-token-cleanup job', () => {
    scheduler = new JobScheduler();

    new TokenModule().registerJobs(scheduler);

    expect(
      scheduler.findJob('expired-token-cleanup')?.isRunning(),
    ).toBeTruthy();
  });
});
