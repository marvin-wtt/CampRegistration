import resetDb from "./reset-db";
import { afterEach, afterAll, beforeEach } from "vitest";
import fse from "fs-extra";
import config from "../../src/config";
import path from "path";
import { resetMailServer, stopMailServer } from "./mail-server";
import { store } from "../../src/middlewares/rateLimiter.middleware";
import { stopJobs } from "../../src/jobs";

beforeEach(async () => {
  await resetDb();
  resetMailServer();
  await resetRateLimiter();
  await clearDirectory(config.storage.tmpDir);
  await clearDirectory(config.storage.uploadDir);
  stopJobs();
});

afterAll(async () => {
  stopMailServer();
});

const clearDirectory = async (dir: string) => {
  const directory = path.join(__dirname, "..", "..", dir);

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
