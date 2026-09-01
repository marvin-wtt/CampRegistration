import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

@injectable()
export class DutyService extends BaseService {
  async getDutyById(eventId: string, id: string) {
    return this.prisma.duty.findFirst({
      where: { id, eventId },
    });
  }

  async queryDuties(eventId: string) {
    return this.prisma.duty.findMany({
      where: { eventId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createDuty(
    eventId: string,
    data: {
      name: string | Record<string, string>;
      defaultCount?: number | null;
      excludeStaff?: boolean;
      balanceCountries?: boolean;
    },
  ) {
    return this.prisma.duty.create({
      data: {
        eventId,
        name: data.name,
        defaultCount: data.defaultCount,
        excludeStaff: data.excludeStaff,
        balanceCountries: data.balanceCountries,
      },
    });
  }

  async updateDutyById(
    id: string,
    data: {
      name?: string | Record<string, string>;
      sortOrder?: number;
      defaultCount?: number | null;
      excludeStaff?: boolean;
      balanceCountries?: boolean;
    },
  ) {
    return this.prisma.duty.update({
      where: { id },
      data,
    });
  }

  async deleteDutyById(id: string) {
    await this.prisma.duty.delete({ where: { id } });
  }
}
