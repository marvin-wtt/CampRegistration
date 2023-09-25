import prisma from "../client";
import { ulid } from "@/utils/ulid";
import ApiError from "@/utils/ApiError";
import httpStatus from "http-status";
import { campService } from "./index";

const getRegistrationById = async (campId: string, id: string) => {
  return prisma.registration.findFirst({
    where: { id, campId },
    include: {
      files: true,
      bed: { include: { room: true } },
    },
  });
};

const queryRegistrations = async (campId: string) => {
  return prisma.registration.findMany({
    where: { campId },
    include: {
      files: true,
      bed: { include: { room: true } },
    },
  });
};

const countRegistrationsByField = async (
  campId: string,
  countryField: string,
  roleField: string,
) => {
  const countryKey = `$.${countryField}`;
  const roleKey = `$.${roleField}`;
  const roleValue = "participant";
  // TODO Filter camp counselors
  // const result = await prisma.$queryRaw(Prisma.sql`
  //   SELECT
  //       JSON_VALUE(registrations.data, ${countryKey}) AS value,
  //       COUNT(*)     AS count
  //   FROM
  //       registrations
  //   WHERE
  //       registrations.camp_id = ${campId}
  //       AND JSON_VALUE(registrations.data, ${roleKey}) = ${roleValue}
  //   GROUP BY
  //       value
  // `);
  const result = {};

  if (!result || !Array.isArray(result)) {
    return undefined;
  }

  const countObject: Record<string, number> = {};
  result.forEach((item) => {
    // Convert bigint to number
    countObject[item.value] = Number(item.count);
  });

  return countObject;
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
  updateBody: object,
) => {
  return prisma.registration.update({
    where: { id: registrationId },
    data: { data: updateBody },
    include: {
      files: true,
      bed: { include: { room: true } },
    },
  });
};

const deleteRegistrationById = async (registrationId: string) => {
  await prisma.registration.delete({ where: { id: registrationId } });
};

export default {
  getRegistrationById,
  queryRegistrations,
  countRegistrationsByField,
  createRegistration,
  updateRegistrationById,
  deleteRegistrationById,
};
