import prisma from '#client.js';

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
  });
};

const createRoom = async (
  campId: string,
  name: string | Record<string, string>,
  capacity: number,
) => {
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
};

const updateRoomById = async (
  roomId: string,
  name?: string | Record<string, string>,
) => {
  return prisma.room.update({
    where: { id: roomId },
    data: {
      name,
    },
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
