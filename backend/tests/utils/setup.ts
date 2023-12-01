import resetDb from "./reset-db";
import { afterEach, beforeEach } from "vitest";
import fse from "fs-extra";
import config from "@/config";
import path from "path";
import { resetMailServer } from "./mail-server";

beforeEach(async () => {
  await resetDb();
  resetMailServer();

  await clearDirectory(config.storage.tmpDir);
  await clearDirectory(config.storage.uploadDir);
});

const clearDirectory = async (dir: string) => {
  const directory = path.join(__dirname, "..", "..", dir);

  await fse.ensureDir(directory);
  await fse.emptydir(directory);
};

afterEach(async () => {
  // TODO Is this correct?
  // await prisma.$disconnect();
});
