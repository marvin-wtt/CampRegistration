import defaultPrisma from '#client';
import { type PrismaClient } from '@prisma/client';

export abstract class BaseService {
  protected prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? defaultPrisma;
  }
}
