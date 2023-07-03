import { type Prisma, PrismaClient } from "@prisma/client";
import data from "./json/room.json";
import { ulid } from "../../src/utils/ulid"

const name = "room";

const run = (prisma: PrismaClient) => {
  const campId = "01H4BK6DFQAVVB5TDS5BJ1AB95 ";

  const rooms: Prisma.RoomCreateManyInput[] = [];

  for (const room of data) {
    rooms.push({
      id: ulid(),
      campId,
      name: room.name,
      capacity: room.capacity,
    });
  }

  return prisma.room.createMany({
    data: rooms,
  });
};

export default {
  name,
  run,
};
