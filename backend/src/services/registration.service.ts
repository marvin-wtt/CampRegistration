import prisma from "../client";
import { ulid } from "@/utils/ulid";
import ApiError from "@/utils/ApiError";
import httpStatus from "http-status";
import { campService } from "./index";
import { Camp, Prisma } from "@prisma/client";
import { objectValueByPath } from "@/utils/objectValueByPath";
import dbJsonPath from "@/utils/dbJsonPath";

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

type RegistrationCreateData = Pick<
  Prisma.RegistrationCreateInput,
  "waitingList" | "data"
>;
const createRegistration = async (
  campId: string,
  data: RegistrationCreateData,
) => {
  const camp = await campService.getCampById(campId);
  if (!camp) {
    throw new ApiError(httpStatus.NOT_FOUND, "Camp not found");
  }

  return prisma.$transaction(async (transaction) => {
    const waitingList =
      data.waitingList ?? (await isWaitingList(transaction, camp, data));
    return transaction.registration.create({
      data: {
        ...data,
        id: ulid(),
        campId,
        waitingList,
      },
      include: { files: true },
    });
  });
};

const isWaitingList = async (
  transaction: Partial<typeof prisma>,
  camp: Camp,
  data: RegistrationCreateData,
) => {
  let maxParticipants = camp.maxParticipants as number | Record<string, number>;
  const campAccessors = camp.accessors as Record<string, (string | number)[]>;

  const filter: Prisma.RegistrationWhereInput[] = [
    {
      campId: camp.id,
    },
  ];

  const rolePath = dbJsonPath("role", campAccessors);
  if (rolePath) {
    filter.push({
      data: {
        path: rolePath,
        equals: "participant",
      },
    });
  }

  // Add country filter
  if (typeof maxParticipants !== "number") {
    const countryPath = dbJsonPath("country", campAccessors);
    const countryValue = objectValueByPath(
      campAccessors["country"],
      data,
    ) as string;
    // Add filter criteria for country
    filter.push({
      data: {
        path: countryPath,
        equals: countryValue,
      },
    });

    // Set country based value as maximum
    maxParticipants = maxParticipants[countryValue];
  }

  const count = await transaction.registration!.count({
    where: { AND: filter },
  });

  return count >= maxParticipants;
};

const updateRegistrationById = async (
  registrationId: string,
  data: Pick<Prisma.RegistrationUpdateInput, "waitingList" | "data">,
) => {
  return prisma.registration.update({
    where: { id: registrationId },
    data,
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
  createRegistration,
  updateRegistrationById,
  deleteRegistrationById,
};
