import prisma, { Prisma } from 'client';
import { ulid } from 'utils/ulid';

const getRoomById = async (campId: string, id: string) => {
  return prisma.room.findFirst({
    where: { id, campId },
    include: { beds: true },
  });
};

const queryRooms = async (campId: string) => {
  return prisma.room.findMany({
    where: { campId },
    include: { beds: true },
    orderBy: {
      order: 'asc',
    },
  });
};

const createRoom = async (
  campId: string,
  data: {
    name: string | Record<string, string>;
    order?: number;
  },
  capacity: number,
) => {
  return prisma.room.create({
    data: {
      id: ulid(),
      campId,
      ...data,
      beds: {
        createMany: {
          data: Array.from({ length: capacity }).map(() => ({
            id: ulid(),
          })),
        },
      },
    },
    include: { beds: true },
  });
};

const updateRoomById = async (roomId: string, data: Prisma.RoomUpdateInput) => {
  return prisma.room.update({
    where: { id: roomId },
    data,
    include: { beds: true },
  });
};

const deleteRoomById = async (roomId: string) => {
  await prisma.room.delete({ where: { id: roomId } });
};

export default {
  getRoomById,
  queryRooms,
  createRoom,
  updateRoomById,
  deleteRoomById,
};
