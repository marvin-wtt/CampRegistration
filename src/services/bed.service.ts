import prisma from "../client";
import { Prisma } from "@prisma/client";

const getBedById = async (campId: string, roomId: string, id: string) => {
  return prisma.bed.findFirst({
    where: { id, roomId },
  });
};

const updateBedById = async (bedId: string, registrationId: string | null) => {
  return prisma.bed.update({
    where: { id: bedId },
    data: {
      registrationId,
    },
    include: {
      registration: true,
    },
  });
};

export default {
  getBedById,
  updateBedById,
};
