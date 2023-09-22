import prisma from "../client";

const getBedById = async (id: string, roomId: string) => {
  return prisma.bed.findFirst({
    where: { id, roomId },
  });
};

const updateBedById = async (id: string, registrationId: string | null) => {
  return prisma.bed.update({
    where: { id },
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
