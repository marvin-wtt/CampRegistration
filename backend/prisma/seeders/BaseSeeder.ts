import type { PrismaClient } from '#/generated/prisma/client.js';

export abstract class BaseSeeder {
  abstract name(): string;

  abstract run(prisma: PrismaClient): Promise<void>;
}
