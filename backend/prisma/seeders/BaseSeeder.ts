import type { PrismaClient } from '#generated/prisma/client';

export abstract class BaseSeeder {
  abstract name(): string;

  abstract run(prisma: PrismaClient): Promise<void>;
}
