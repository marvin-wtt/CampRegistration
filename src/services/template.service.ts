import { type Prisma } from "@prisma/client";
import prisma from "../client";
import { orderedUuid } from "../utils/uuid";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";
import { campService } from "./index";

const getTemplateById = async (id: string) => {
  return prisma.template.findFirst({
    where: { id },
  });
};

const queryTemplates = async (campId: string) => {
  return prisma.template.findMany({
    where: {
      campId: campId,
    },
  });
};

const createTemplate = async (campId: string, data: object) => {
  const camp = await campService.getCampById(campId);
  if (!camp) {
    throw new ApiError(httpStatus.NOT_FOUND, "Camp not found");
  }
  return prisma.template.create({
    data: {
      id: orderedUuid(),
      data: data,
      campId: campId,
    },
  });
};

const updateTemplateById = async (
  templateId: string,
  updateBody: Omit<Prisma.TemplateUpdateInput, "id">
) => {
  const template = await getTemplateById(templateId);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, "Template not found");
  }
  return prisma.template.update({
    where: { id: template.id },
    data: updateBody,
  });
};

const deleteTemplateById = async (templateId: string) => {
  const template = await getTemplateById(templateId);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, "Template not found");
  }
  await prisma.template.delete({ where: { id: template.id } });
  return template;
};

export default {
  getTemplateById,
  queryTemplates,
  createTemplate,
  updateTemplateById,
  deleteTemplateById,
};
