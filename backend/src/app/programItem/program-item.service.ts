import { Prisma } from '#generated/prisma/client';
import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

type NullableTranslation = string | Record<string, string> | null | undefined;

interface ProgramItemUpdateDto extends Omit<
  Prisma.ProgramItemUpdateInput,
  'id' | 'details' | 'location'
> {
  details: NullableTranslation;
  location: NullableTranslation;
}

@injectable()
export class ProgramItemService extends BaseService {
  async getProgramItemById(eventId: string, id: string) {
    return this.prisma.programItem.findFirst({
      where: { id, eventId },
    });
  }

  async queryProgramItem(eventId: string) {
    return this.prisma.programItem.findMany({
      where: { eventId },
    });
  }

  async createProgramItem(
    eventId: string,
    data: Omit<Prisma.ProgramItemCreateInput, 'id' | 'event'>,
  ) {
    return this.prisma.programItem.create({
      data: {
        eventId,
        ...data,
      },
    });
  }

  async updateProgramItemById(id: string, data: ProgramItemUpdateDto) {
    return this.prisma.programItem.update({
      where: { id },
      data: {
        ...data,
        location: data.location === null ? Prisma.JsonNull : data.location,
        details: data.details === null ? Prisma.JsonNull : data.details,
      },
    });
  }

  async deleteProgramItemById(id: string) {
    await this.prisma.programItem.delete({ where: { id } });
  }
}
