import { type Prisma, PrismaClient } from "@prisma/client";
import data from "./json/room.json";
import { ulid } from "../../src/utils/ulid";
const name = "room";

const run = async (prisma: PrismaClient) => {
  const campId = "01H4BK6DFQAVVB5TDS5BJ1AB95 ";

  for (const room of data) {
    const beds: Prisma.BedCreateManyRoomInput[] = [];

    for (let i = 0; i < room.capacity; i++) {
      beds.push({
        id: ulid(),
      });
    }

    await prisma.room.create({
      data: {
        id: ulid(),
        campId,
        name: room.name,
        capacity: room.capacity,
        beds: {
          createMany: {
            data: beds,
          },
        },
      },
    });
  }
};

export default {
  name,
  run,
};
