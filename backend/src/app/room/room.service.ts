import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import httpStatus from 'http-status';
import ApiError from '#core/router/ApiError';
import type { PrismaTransaction } from '#core/database/transaction';
import type { RoomUpdateData } from '@camp-registration/common/entities';
import { ulid } from '#utils/ulid';

// Bed positions in the planner follow this order. Beds get monotonic ULIDs,
// since the default generator doesn't order ids within one millisecond.
const withBeds = { beds: { orderBy: { id: 'asc' } } } as const;

@injectable()
export class RoomService extends BaseService {
  async getRoomById(eventId: string, id: string) {
    return this.prisma.room.findFirst({
      where: { id, eventId },
      include: withBeds,
    });
  }

  async queryRooms(eventId: string) {
    return this.prisma.room.findMany({
      where: { eventId },
      include: withBeds,
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
            data: Array.from({ length: capacity }).map(() => ({ id: ulid() })),
          },
        },
      },
      include: withBeds,
    });
  }

  async updateRoomById(roomId: string, data: RoomUpdateData) {
    const { capacity, ...fields } = data;

    return this.transaction(async (tx) => {
      if (capacity !== undefined) {
        await this.resizeRoom(tx, roomId, capacity);
      }

      return tx.room.update({
        where: { id: roomId },
        data: fields,
        include: withBeds,
      });
    });
  }

  // Grows with new beds, or shrinks by removing the last empty ones.
  private async resizeRoom(
    tx: PrismaTransaction,
    roomId: string,
    capacity: number,
  ) {
    // Serializes resizes of one room, so concurrent grows can't both insert.
    await tx.$queryRaw`SELECT id FROM rooms WHERE id = ${roomId} FOR UPDATE`;
    const beds = await tx.bed.findMany({
      where: { roomId },
      orderBy: { id: 'asc' },
      select: { id: true, registrationId: true },
    });
    const diff = capacity - beds.length;

    if (diff > 0) {
      await tx.bed.createMany({
        data: Array.from({ length: diff }).map(() => ({ id: ulid(), roomId })),
      });
      return;
    }
    if (diff === 0) {
      return;
    }

    const removeIds = beds
      .filter((bed) => bed.registrationId === null)
      .slice(diff)
      .map((bed) => bed.id);
    const conflict = () =>
      new ApiError(
        httpStatus.CONFLICT,
        'Not enough empty beds to reduce the room capacity',
      );
    if (removeIds.length < -diff) {
      throw conflict();
    }
    // Re-checks occupancy under lock, so a bed assigned concurrently survives
    // and the whole resize rolls back.
    const { count } = await tx.bed.deleteMany({
      where: { id: { in: removeIds }, registrationId: null },
    });
    if (count < -diff) {
      throw conflict();
    }
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
          include: withBeds,
        }),
      ),
    );
  }

  async deleteRoomById(roomId: string) {
    await this.prisma.room.delete({ where: { id: roomId } });
  }
}
