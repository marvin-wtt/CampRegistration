import defaultPrisma from '#core/database/database.client';
import { type PrismaClient } from '#generated/prisma/client.js';

export abstract class BaseService {
  protected prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? defaultPrisma;
  }
}
