import { type Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import data from "./json/room.json";

const name = "room";

const run = (prisma: PrismaClient) => {
  const campId = "98daa32a-f6dd-41bd-b723-af10071459ad";

  const rooms: Prisma.RoomCreateManyInput[] = [];

  for (const room of data) {
    rooms.push({
      id: randomUUID(),
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
