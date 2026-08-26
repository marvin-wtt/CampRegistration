import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

@injectable()
export class RoomService extends BaseService {
  async getRoomById(eventId: string, id: string) {
    return this.prisma.room.findFirst({
      where: { id, eventId },
      include: { beds: true },
    });
  }

  async queryRooms(eventId: string) {
    return this.prisma.room.findMany({
      where: { eventId },
      include: { beds: true },
    });
  }

  async createRoom(
    eventId: string,
    name: string | Record<string, string>,
    capacity: number,
  ) {
    return this.prisma.room.create({
      data: {
        name,
        eventId,
        beds: {
          createMany: {
            data: Array.from({ length: capacity }).map(() => ({})),
          },
        },
      },
      include: { beds: true },
    });
  }

  async updateRoomById(
    roomId: string,
    name?: string | Record<string, string>,
    sortOrder?: number,
  ) {
    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        name,
        sortOrder,
      },
      include: { beds: true },
    });
  }

  async bulkUpdateRooms(
    eventId: string,
    rooms: {
      id: string;
      name?: string | Record<string, string>;
      sortOrder?: number;
    }[],
  ) {
    return this.prisma.$transaction(
      rooms.map((room) =>
        this.prisma.room.update({
          where: { id: room.id, eventId },
          data: {
            name: room.name,
            sortOrder: room.sortOrder,
          },
          include: { beds: true },
        }),
      ),
    );
  }

  async deleteRoomById(roomId: string) {
    await this.prisma.room.delete({ where: { id: roomId } });
  }
}
