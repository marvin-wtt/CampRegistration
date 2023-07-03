import { type Prisma } from "@prisma/client";
import prisma from "../client";
import { ulid } from "../utils/ulid";

const getRoomById = async (campId: string, id: string) => {
  return prisma.room.findFirst({
    where: { id, campId },
  });
};

const queryRooms = async (campId: string) => {
  return prisma.room.findMany({
    where: { campId },
  });
};

const createRoom = async (campId: string, name: string, capacity: number) => {
  return prisma.room.create({
    data: {
      id: ulid(),
      name,
      capacity,
      campId,
    },
  });
};

const updateRoomById = async (
  roomId: string,
  updateBody: Omit<Prisma.RoomUpdateInput, "id">
) => {
  return prisma.room.update({
    where: { id: roomId },
    data: updateBody,
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
