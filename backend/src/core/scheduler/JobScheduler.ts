import { Cron, type CronOptions } from 'croner';
import { injectable } from 'inversify';
import moment from 'moment';
import logger from '#core/logger';
import { describeError } from '#utils/errors';
import { runWithJobContext } from '#core/context/jobContext';

export type JobHandler = () => void | Promise<void>;

/**
 * Central scheduler for recurring background jobs. Wraps `croner` and owns the
 * lifecycle logging (execution/completion/termination/protection/error).
 *
 * Modules register their jobs through the `registerJobs(scheduler)` lifecycle
 * hook during boot; the scheduler keeps its own list so it can be stopped
 * deterministically on shutdown (independent of croner's global registry).
 */
@injectable()
export class JobScheduler {
  private readonly jobs: Cron[] = [];

  /**
   * Schedules a named job. Duplicate names are ignored so registration is
   * idempotent. Jobs without any future or past run are discarded.
   */
  schedule(
    name: string,
    pattern: string,
    fn: JobHandler,
    options: CronOptions = {},
  ): void {
    if (this.findJob(name)) {
      logger.warn(`Job ${name} already scheduled. Skipping.`);
      return;
    }

    const jobOptions: CronOptions = {
      ...options,
      name,
      protect: (job) => {
        this.onProtected(job);
      },
      catch: (error: unknown, job: Cron) => {
        this.onError(error, job);
      },
    };

    const job = new Cron(pattern, jobOptions, (job) => this.run(fn, job));

    if (!job.nextRun() && !job.previousRun()) {
      job.stop();
      return;
    }

    this.jobs.push(job);
  }

  findJob(name: string): Cron | undefined {
    return this.jobs.find((job) => job.name === name);
  }

  /** Stops every scheduled job and clears the registry. */
  stop(): void {
    for (const job of this.jobs) {
      job.stop();
    }
    this.jobs.length = 0;
  }

  private run(fn: JobHandler, job: Cron): Promise<void> {
    return this.withContext(job, async () => {
      this.onExecution();
      await fn();
      this.onCompletion(job);
      if (!job.nextRun()) {
        this.onTermination('No further executions scheduled');
      }
    });
  }

  // croner invokes `protect`/`catch` outside the run's async chain, so the
  // context is set explicitly for those too.
  private withContext<T>(job: Cron, fn: () => T): T {
    return runWithJobContext(
      { source: 'scheduler', name: job.name ?? '??' },
      fn,
    );
  }

  private onError(error: unknown, job: Cron): void {
    this.withContext(job, () => {
      logger.error(`Job failed. ${describeError(error)}`);
    });
  }

  private onProtected(job: Cron): void {
    const startTime = job.currentRun()?.toISOString();
    this.withContext(job, () => {
      logger.warn(`Job was blocked by call started at ${startTime ?? '??'}`);
    });
  }

  private onTermination(reason: string): void {
    logger.info(`Job terminated. ${reason}`);
  }

  private onExecution(): void {
    logger.info('Job executing...');
  }

  private onCompletion(job: Cron): void {
    const duration = moment
      .duration(moment().diff(job.currentRun()))
      .humanize();
    logger.info(`Job completed after ${duration}`);
  }
}
