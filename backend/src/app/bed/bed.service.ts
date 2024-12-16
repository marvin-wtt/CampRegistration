import prisma from '../../client.js';
import { ulid } from '#utils/ulid';

const getBedById = async (id: string, roomId: string) => {
  return prisma.bed.findFirst({
    where: { id, roomId },
  });
};

const createBed = async (roomId: string, registrationId?: string) => {
  return prisma.bed.create({
    data: {
      id: ulid(),
      roomId,
      registrationId,
    },
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

const deleteBedById = async (id: string) => {
  return prisma.bed.delete({
    where: {
      id,
    },
  });
};

export default {
  getBedById,
  createBed,
  updateBedById,
  deleteBedById,
};
