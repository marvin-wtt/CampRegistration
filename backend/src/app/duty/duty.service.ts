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
      rotationUnit?: 'PARTICIPANT' | 'ROOM';
      defaultCount?: number | null;
    },
  ) {
    return this.prisma.duty.create({
      data: {
        eventId,
        name: data.name,
        rotationUnit: data.rotationUnit,
        defaultCount: data.defaultCount,
      },
    });
  }

  async updateDutyById(
    id: string,
    data: {
      name?: string | Record<string, string>;
      sortOrder?: number;
      rotationUnit?: 'PARTICIPANT' | 'ROOM';
      defaultCount?: number | null;
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
