import { PrismaClient } from '@prisma/client';

const name = 'registration';

const run = (prisma: PrismaClient) => {
  // TODO seed data
  return Promise.resolve();
};

export default {
  name,
  run,
};
