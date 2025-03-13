import prisma from '#client.js';

class RoomService {
  async getRoomById(campId: string, id: string) {
    return prisma.room.findFirst({
      where: { id, campId },
      include: { beds: true },
    });
  }

  async queryRooms(campId: string) {
    return prisma.room.findMany({
      where: { campId },
      include: { beds: true },
    });
  }

  async createRoom(
    campId: string,
    name: string | Record<string, string>,
    capacity: number,
  ) {
    return prisma.room.create({
      data: {
        name,
        campId,
        beds: {
          createMany: {
            data: Array.from({ length: capacity }).map(() => ({})),
          },
        },
      },
      include: { beds: true },
    });
  }

  async updateRoomById(roomId: string, name?: string | Record<string, string>) {
    return prisma.room.update({
      where: { id: roomId },
      data: {
        name,
      },
      include: { beds: true },
    });
  }

  async deleteRoomById(roomId: string) {
    await prisma.room.delete({ where: { id: roomId } });
  }
}

export default new RoomService();
