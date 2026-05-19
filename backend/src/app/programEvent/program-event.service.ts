import { Prisma } from '#generated/prisma/client';
import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

type NullableTranslation = string | Record<string, string> | null | undefined;

interface ProgramEventUpdateDto extends Omit<
  Prisma.ProgramEventUpdateInput,
  'id' | 'details' | 'location'
> {
  details: NullableTranslation;
  location: NullableTranslation;
}

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

  async updateProgramEventById(id: string, data: ProgramEventUpdateDto) {
    return this.prisma.programEvent.update({
      where: { id },
      data: {
        ...data,
        location: data.location === null ? Prisma.JsonNull : data.location,
        details: data.details === null ? Prisma.JsonNull : data.details,
      },
    });
  }

  async deleteProgramEventById(id: string) {
    await this.prisma.programEvent.delete({ where: { id } });
  }
}
