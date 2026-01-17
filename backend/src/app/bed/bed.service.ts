import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

@injectable()
export class BedService extends BaseService {
  async getBedById(id: string, roomId: string) {
    return this.prisma.bed.findFirst({
      where: { id, roomId },
    });
  }

  async createBed(roomId: string, registrationId?: string) {
    return this.prisma.bed.create({
      data: {
        roomId,
        registrationId,
      },
    });
  }

  async updateBedById(id: string, registrationId: string | null) {
    return this.prisma.bed.update({
      where: { id },
      data: {
        registrationId,
      },
      include: {
        registration: true,
      },
    });
  }

  async deleteBedById(id: string) {
    return this.prisma.bed.delete({
      where: {
        id,
      },
    });
  }
}
