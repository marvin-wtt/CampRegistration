import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import httpStatus from 'http-status';
import ApiError from '#core/router/ApiError';

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

  // Occupied beds are kept; unassign the person first.
  async deleteBedById(id: string) {
    const { count } = await this.prisma.bed.deleteMany({
      where: { id, registrationId: null },
    });
    if (count > 0) {
      return;
    }
    const bed = await this.prisma.bed.findUnique({ where: { id } });
    if (bed) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'An occupied bed cannot be removed',
      );
    }
    throw new ApiError(httpStatus.NOT_FOUND, 'Bed not found');
  }
}
