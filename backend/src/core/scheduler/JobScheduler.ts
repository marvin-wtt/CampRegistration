import { Cron, type CronOptions } from 'croner';
import { injectable } from 'inversify';
import moment from 'moment';
import logger from '#core/logger';

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

  private async run(fn: JobHandler, job: Cron): Promise<void> {
    this.onExecution(job);
    await fn();
    this.onCompletion(job);
    if (!job.nextRun()) {
      this.onTermination('No further executions scheduled', job);
    }
  }

  private onError(error: unknown, job: Cron): void {
    logger.error(`Job ${job.name ?? '??'} failed. ${JSON.stringify(error)}`);
  }

  private onProtected(job: Cron): void {
    const startTime = job.currentRun()?.toISOString();
    logger.warn(
      `Job ${job.name ?? '??'} was blocked by call started at ${startTime ?? '??'}`,
    );
  }

  private onTermination(reason: string, job: Cron): void {
    logger.info(`Job ${job.name ?? '??'} terminated. ${reason}`);
  }

  private onExecution(job: Cron): void {
    logger.info(`Job ${job.name ?? '??'} executing...`);
  }

  private onCompletion(job: Cron): void {
    const duration = moment
      .duration(moment().diff(job.currentRun()))
      .humanize();
    logger.info(`Job ${job.name ?? '??'} completed after ${duration}`);
  }
}
