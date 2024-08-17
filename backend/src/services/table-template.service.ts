import { type Prisma } from '@prisma/client';
import prisma from 'client';
import { ulid } from 'utils/ulid';

const getTemplateById = async (campId: string, id: string) => {
  return prisma.tableTemplate.findFirst({
    where: { id, campId },
  });
};

const queryTemplates = async (campId: string) => {
  return prisma.tableTemplate.findMany({
    where: { campId },
  });
};

const createTemplate = async (campId: string, data: object) => {
  return prisma.tableTemplate.create({
    data: {
      id: ulid(),
      data,
      campId,
    },
  });
};

const updateTemplateById = async (
  templateId: string,
  data: Prisma.InputJsonValue,
) => {
  return prisma.tableTemplate.update({
    where: { id: templateId },
    data: {
      data,
    },
  });
};

const deleteTemplateById = async (templateId: string) => {
  await prisma.tableTemplate.delete({ where: { id: templateId } });
};

export default {
  getTemplateById,
  queryTemplates,
  createTemplate,
  updateTemplateById,
  deleteTemplateById,
};
