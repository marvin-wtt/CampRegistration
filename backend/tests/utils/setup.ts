import resetDb from './reset-db';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import fse from 'fs-extra';
import config from '../../src/config';
import path from 'path';
import { stopJobs } from '../../src/jobs';
import { NoOpMailer } from '../../src/core/mail/noop.mailer.js';
import { Request, Response, NextFunction, Express } from 'express';
import { boot, shutdown } from '../../src/boot';
import { createApp } from '../../src/app';

vi.mock('../../src/middlewares/rateLimiter.middleware', () => ({
  generalLimiter: skipMiddleware,
  authLimiter: skipMiddleware,
  staticLimiter: skipMiddleware,
}));

const skipMiddleware = (_req: Request, _res: Response, next: NextFunction) =>
  next();

export let app: Express | undefined;

beforeAll(async () => {
  await boot();

  app = createApp();
});

beforeEach(async () => {
  // mailer
  vi.spyOn(NoOpMailer.prototype, 'sendMail').mockResolvedValue();

  await resetDb();
  await clearDirectory(config.storage.tmpDir);
  await clearDirectory(config.storage.uploadDir);
  stopJobs();
});

async function clearDirectory(relativeDir: string) {
  const directory = path.join(__dirname, '..', '..', relativeDir);

  await fse.ensureDir(directory);
  await fse.emptyDir(directory);
}

afterEach(async () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

afterAll(async () => {
  stopJobs();

  await shutdown();
});
