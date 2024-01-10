import resetDb from './reset-db';
import { afterEach, beforeEach, vi } from 'vitest';
import fse from 'fs-extra';
import config from '../../src/config';
import path from 'path';
import { store } from '../../src/middlewares/rateLimiter.middleware';
import { stopJobs } from '../../src/jobs';
import mailer from '../../src/config/mail';

beforeEach(async () => {
  vi.spyOn(mailer, 'sendMail');

  await resetDb();
  await resetRateLimiter();
  await clearDirectory(config.storage.tmpDir);
  await clearDirectory(config.storage.uploadDir);
  stopJobs();
});

const clearDirectory = async (dir: string) => {
  const directory = path.join(__dirname, '..', '..', dir);

  await fse.ensureDir(directory);
  await fse.emptydir(directory);
};

const resetRateLimiter = async () => {
  return store.resetAll();
};

afterEach(async () => {
  // TODO Is this correct?
  // await prisma.$disconnect();
});
