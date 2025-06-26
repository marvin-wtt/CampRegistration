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
  // Mock rate limiters to do nothing
  generalLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  authLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  staticLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

export let app: Express | undefined;

beforeAll(startApp);

beforeEach(async () => {
  // mailer
  vi.spyOn(NoOpMailer.prototype, 'sendMail').mockResolvedValue();

  await resetDb();
  await clearDirectory(config.storage.tmpDir);
  await clearDirectory(config.storage.uploadDir);
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

afterAll(stopApp);

async function startApp() {
  await boot();

  app = createApp();
}

async function stopApp() {
  stopJobs();

  await shutdown();
}

export async function restartApp() {
  await stopApp();
  await startApp();
}
