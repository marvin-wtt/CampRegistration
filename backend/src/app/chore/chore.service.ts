import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

@injectable()
export class ChoreService extends BaseService {
  async getChoreById(eventId: string, id: string) {
    return this.prisma.chore.findFirst({
      where: { id, eventId },
    });
  }

  async queryChores(eventId: string) {
    return this.prisma.chore.findMany({
      where: { eventId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createChore(
    eventId: string,
    data: {
      name: string | Record<string, string>;
      defaultCount?: number | null;
      excludeStaff?: boolean;
      balanceCountries?: boolean;
    },
  ) {
    return this.prisma.chore.create({
      data: {
        eventId,
        name: data.name,
        defaultCount: data.defaultCount,
        excludeStaff: data.excludeStaff,
        balanceCountries: data.balanceCountries,
      },
    });
  }

  async updateChoreById(
    id: string,
    data: {
      name?: string | Record<string, string>;
      sortOrder?: number;
      defaultCount?: number | null;
      excludeStaff?: boolean;
      balanceCountries?: boolean;
    },
  ) {
    return this.prisma.chore.update({
      where: { id },
      data,
    });
  }

  async deleteChoreById(id: string) {
    await this.prisma.chore.delete({ where: { id } });
  }
}
