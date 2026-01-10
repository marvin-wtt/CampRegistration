import resetDb from './reset-db.js';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import fse from 'fs-extra';
import { stopJobs } from '#jobs/index';
import { NoOpMailer } from '#app/mail/noop.mailer.js';
import { Request, Response, NextFunction, Express } from 'express';
import { boot, shutdown } from '#boot.js';
import { createApp } from '#app.js';
import path from 'path';

vi.mock('../../src/middlewares/rateLimiter.middleware', () => ({
  // Mock rate limiters to do nothing
  generalLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  authLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  staticLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

export let app: Express | undefined;

export async function bootApp() {
  await boot();

  app = createApp();
}

export async function restartApp() {
  await stopApp();
  await bootApp();
}

export async function stopApp() {
  stopJobs();

  await shutdown();
}

beforeAll(bootApp);

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

afterAll(stopApp);
