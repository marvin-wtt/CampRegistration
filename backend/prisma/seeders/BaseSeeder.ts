import type { PrismaClient } from '#prisma/client.js';

export abstract class BaseSeeder {
  abstract name(): string;

  abstract run(prisma: PrismaClient): Promise<void>;
}
