import { type Prisma } from '@prisma/client';
import prisma from 'client';
import { ulid } from 'utils/ulid';
import {
  baseObjectInputType,
  baseObjectOutputType,
  Writeable,
  ZodArray,
  ZodBoolean,
  ZodEnum,
  ZodFunction,
  ZodNullable,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodRecord,
  ZodString,
  ZodTuple,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  ZodUnion,
  ZodUnknown,
} from 'zod';
import { Output } from 'tsc-alias/dist/utils';

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

const createManyTemplates = async (campId: string, templates: object[]) => {
  const data = templates.map((template) => {
    return {
      id: ulid(),
      data: template,
      campId,
    };
  });

  return prisma.tableTemplate.createMany({
    data,
  });
};

const updateTemplateById = async (templateId: string, data: object) => {
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
  createManyTemplates,
  updateTemplateById,
  deleteTemplateById,
};
