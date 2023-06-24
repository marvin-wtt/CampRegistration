import resetDb from "./reset-db";
import {afterEach, beforeEach} from "vitest";

beforeEach(async () => {
  await resetDb();
});

afterEach(async () => {
  // TODO Is this correct?
  // await prisma.$disconnect();
});
