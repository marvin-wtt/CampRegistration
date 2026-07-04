import { afterEach, describe, expect, it } from 'vitest';
import { JobScheduler } from '#core/scheduler/JobScheduler';
import { AuditModule } from '#app/audit/audit.module';

describe('AuditModule.registerJobs', () => {
  let scheduler: JobScheduler;

  afterEach(() => {
    scheduler?.stop();
  });

  it('schedules a running audit-log-retention-cleanup job', () => {
    scheduler = new JobScheduler();

    new AuditModule().registerJobs(scheduler);

    const job = scheduler.findJob('audit-log-retention-cleanup');

    expect(job?.isRunning()).toBeTruthy();
  });

  it('schedules a running audit-log-ip-scrub job', () => {
    scheduler = new JobScheduler();

    new AuditModule().registerJobs(scheduler);

    expect(scheduler.findJob('audit-log-ip-scrub')?.isRunning()).toBeTruthy();
  });
});
