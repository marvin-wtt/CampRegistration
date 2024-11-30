import resetDb from './reset-db';
import { afterEach, beforeEach, vi } from 'vitest';
import fse from 'fs-extra';
import config from '../../src/config';
import path from 'path';
import { stopJobs } from '../../src/jobs';
import mailer from '../../src/core/mail';
import { Request, Response, NextFunction } from 'express';

const skipMiddleware = (req: Request, res: Response, next: NextFunction) =>
  next();
vi.mock('../../src/middlewares/rateLimiter.middleware', () => ({
  generalLimiter: skipMiddleware,
  authLimiter: skipMiddleware,
  staticLimiter: skipMiddleware,
}));

beforeEach(async () => {
  // mailer
  vi.spyOn(mailer, 'sendMail').mockResolvedValue({});

  await resetDb();
  await clearDirectory(config.storage.tmpDir);
  await clearDirectory(config.storage.uploadDir);
  stopJobs();
});

const clearDirectory = async (dir: string) => {
  const directory = path.join(__dirname, '..', '..', dir);

  await fse.ensureDir(directory);
  await fse.emptydir(directory);
};

afterEach(async () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
  // TODO Is this correct?
  // await prisma.$disconnect();
});
