import { type Prisma } from "@prisma/client";
import prisma from "../client";
import { ulid } from "../utils/ulid";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";
import { campService } from "./index";

const getRegistrationById = async (campId: string, id: string) => {
  return prisma.registration.findFirst({
    where: { id, campId },
    include: { files: true },
  });
};

const queryRegistrations = async (campId: string) => {
  return prisma.registration.findMany({
    where: { campId },
    include: { files: true },
  });
};

const createRegistration = async (campId: string, data: object) => {
  const camp = await campService.getCampById(campId);
  if (!camp) {
    throw new ApiError(httpStatus.NOT_FOUND, "Camp not found");
  }
  return prisma.registration.create({
    data: {
      id: ulid(),
      data: data,
      campId: campId,
    },
    include: { files: true },
  });
};

const updateRegistrationById = async (
  registrationId: string,
  updateBody: Omit<Prisma.RegistrationUpdateInput, "id">
) => {
  return prisma.registration.update({
    where: { id: registrationId },
    data: { data: updateBody as object },
  });
};

const deleteRegistrationById = async (registrationId: string) => {
  await prisma.registration.delete({ where: { id: registrationId } });
};

export default {
  getRegistrationById,
  queryRegistrations,
  createRegistration,
  updateRegistrationById,
  deleteRegistrationById,
};
