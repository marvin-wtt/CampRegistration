import { type Prisma } from '@prisma/client';
import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

@injectable()
export class ProgramEventService extends BaseService {
  async getProgramEventById(campId: string, id: string) {
    return this.prisma.programEvent.findFirst({
      where: { id, campId },
    });
  }

  async queryProgramEvent(campId: string) {
    return this.prisma.programEvent.findMany({
      where: { campId },
    });
  }

  async createProgramEvent(
    campId: string,
    data: Omit<Prisma.ProgramEventCreateInput, 'id' | 'camp'>,
  ) {
    return this.prisma.programEvent.create({
      data: {
        campId,
        ...data,
      },
    });
  }

  async updateProgramEventById(
    id: string,
    data: Omit<Prisma.ProgramEventUpdateInput, 'id'>,
  ) {
    return this.prisma.programEvent.update({
      where: { id: id },
      data,
    });
  }

  async deleteProgramEventById(id: string) {
    await this.prisma.programEvent.delete({ where: { id: id } });
  }
}
