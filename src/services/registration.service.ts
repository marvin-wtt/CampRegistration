import { type Prisma } from "@prisma/client";
import prisma from "../client";
import { orderedUuid } from "../utils/uuid";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";
import { campService } from "./index";

const getRegistrationById = async (id: string) => {
  return prisma.registration.findFirst({
    where: { id },
    include: {
      files: true
    }
  });
};

const queryRegistrations = async (campId: string) => {
  return prisma.registration.findMany({
    where: {
      campId: campId,
    },
    include: {
      files: true
    }
  });
};

const createRegistration = async (campId: string, data: object) => {
  const camp = await campService.getCampById(campId);
  if (!camp) {
    throw new ApiError(httpStatus.NOT_FOUND, "Camp not found");
  }
  return prisma.registration.create({
    data: {
      id: orderedUuid(),
      data: data,
      campId: campId,
    },
    include: {
      files: true
    }
  });
};

const updateRegistrationById = async (
  registrationId: string,
  updateBody: Omit<Prisma.RegistrationUpdateInput, "id">
) => {
  const registration = await getRegistrationById(registrationId);
  if (!registration) {
    throw new ApiError(httpStatus.NOT_FOUND, "Registration not found");
  }
  return prisma.registration.update({
    where: { id: registration.id },
    data: updateBody,
  });
};

const deleteRegistrationById = async (registrationId: string) => {
  const registration = await getRegistrationById(registrationId);
  if (!registration) {
    throw new ApiError(httpStatus.NOT_FOUND, "Registration not found");
  }
  await prisma.registration.delete({ where: { id: registration.id } });
  return registration;
};

export default {
  getRegistrationById,
  queryRegistrations,
  createRegistration,
  updateRegistrationById,
  deleteRegistrationById,
};
