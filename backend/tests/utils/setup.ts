import resetDb from './reset-db';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import fse from 'fs-extra';
import { stopJobs } from '../../src/jobs';
import { NoOpMailer } from '../../src/app/mail/noop.mailer.js';
import { Request, Response, NextFunction, Express } from 'express';
import { boot, shutdown } from '../../src/boot';
import { createApp } from '../../src/app';
import path from 'path';

vi.mock('../../src/middlewares/rateLimiter.middleware', () => ({
  // Mock rate limiters to do nothing
  generalLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  authLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  staticLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

export let app: Express | undefined;

beforeAll(async () => {
  await boot();

  app = createApp();
});

beforeEach(async () => {
  // mailer
  vi.spyOn(NoOpMailer.prototype, 'sendMail').mockResolvedValue();

  await resetDb();
  await clearDirectory(path.join(__dirname, '..', 'tmp', 'storage', 'tmp'));
  await clearDirectory(path.join(__dirname, '..', 'tmp', 'storage', 'uploads'));
  stopJobs();
});

async function clearDirectory(directory: string) {
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
