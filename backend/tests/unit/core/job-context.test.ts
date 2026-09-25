import { describe, expect, it } from 'vitest';
import { Writable } from 'node:stream';
import winston from 'winston';
import { formatJobTag, jobContextFormat } from '#core/logger';
import { type JobContext, runWithJobContext } from '#core/context/jobContext';

function createLogger() {
  const entries: Record<string, unknown>[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      entries.push(JSON.parse(chunk.toString()) as Record<string, unknown>);
      callback();
    },
  });

  const logger = winston.createLogger({
    format: winston.format.combine(jobContextFormat(), winston.format.json()),
    transports: [new winston.transports.Stream({ stream })],
  });

  return { logger, entries };
}

const job: JobContext = {
  source: 'queue',
  queue: 'mail',
  name: 'send',
  id: 'job-1',
  attempt: 2,
};

describe('job context logging', () => {
  it('stamps the job context onto entries logged inside a job', async () => {
    const { logger, entries } = createLogger();

    await runWithJobContext(job, async () => {
      logger.info('before await');
      await new Promise((resolve) => setTimeout(resolve, 1));
      logger.info('after await');
    });

    expect(entries).toHaveLength(2);
    expect(entries[0].job).toEqual(job);
    expect(entries[1].job).toEqual(job);
  });

  it('leaves entries outside a job untouched', () => {
    const { logger, entries } = createLogger();

    logger.info('request');

    expect(entries[0]).not.toHaveProperty('job');
  });

  it('formats a compact tag per job source', () => {
    expect(formatJobTag(job)).toBe('[job mail/send#job-1 attempt 2]');
    expect(formatJobTag({ source: 'scheduler', name: 'token-cleanup' })).toBe(
      '[cron token-cleanup]',
    );
  });
});
