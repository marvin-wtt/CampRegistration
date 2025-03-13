import prisma from '#client.js';

class BedService {
  async getBedById(id: string, roomId: string) {
    return prisma.bed.findFirst({
      where: { id, roomId },
    });
  }

  async createBed(roomId: string, registrationId?: string) {
    return prisma.bed.create({
      data: {
        roomId,
        registrationId,
      },
    });
  }

  async updateBedById(id: string, registrationId: string | null) {
    return prisma.bed.update({
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
    return prisma.bed.delete({
      where: {
        id,
      },
    });
  }
}

export default new BedService();
