import { type Prisma } from '@prisma/client';
import prisma from 'client';
import { ulid } from 'utils/ulid';

const getProgramEventById = async (campId: string, id: string) => {
  return prisma.programEvent.findFirst({
    where: { id, campId },
  });
};

const queryProgramEvent = async (campId: string) => {
  return prisma.programEvent.findMany({
    where: { campId },
  });
};

const createProgramEvent = async (
  campId: string,
  data: Omit<Prisma.ProgramEventCreateInput, 'id' | 'camp'>,
) => {
  return prisma.programEvent.create({
    data: {
      id: ulid(),
      campId,
      ...data,
    },
  });
};

const updateProgramEventById = async (
  roomId: string,
  updateBody: Omit<Prisma.ProgramEventUpdateInput, 'id'>,
) => {
  return prisma.programEvent.update({
    where: { id: roomId },
    data: updateBody,
  });
};

const deleteProgramEventById = async (id: string) => {
  await prisma.programEvent.delete({ where: { id: id } });
};

export default {
  getProgramEventById,
  queryProgramEvent,
  createProgramEvent,
  updateProgramEventById,
  deleteProgramEventById,
};
