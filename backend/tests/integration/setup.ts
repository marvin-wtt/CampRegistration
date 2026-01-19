import './mocks/mockRateLimiter.js';

import resetDb from './utils/reset-db.js';
import { afterAll, beforeAll, beforeEach, vi } from 'vitest';
import fse from 'fs-extra';
import { stopJobs } from '#jobs/index';
import { Express } from 'express';
import { boot, shutdown } from '#boot.js';
import { createApp } from '#app.js';
import path from 'path';
import { mockQueue } from './mocks/mockQueue.js';
import { mockMailer } from './mocks/mockMailer.js';

mockQueue();

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
  mockMailer();

  await resetDb();
  await clearDirectory(path.join(__dirname, '..', 'tmp', 'storage', 'tmp'));
  await clearDirectory(path.join(__dirname, '..', 'tmp', 'storage', 'uploads'));
  stopJobs();
});

async function clearDirectory(directory: string) {
  await fse.ensureDir(directory);
  await fse.emptyDir(directory);
}

afterAll(async () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

afterAll(stopApp);
