import prisma from "../client";
import { ulid } from "@/utils/ulid";
import ApiError from "@/utils/ApiError";
import httpStatus from "http-status";
import { Camp, Prisma, Registration } from "@prisma/client";
import dbJsonPath from "@/utils/dbJsonPath";
import { formUtils } from "@/utils/form";

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

const getParticipantsCount = async (campId: string) => {
  return prisma.registration.count({
    where: createRegistrationRoleFilter(campId, "participant"),
  });
};

const getParticipantsCountByCountry = async (
  campId: string,
  countries: string[],
) => {
  const participants = await prisma.registration.findMany({
    where: createRegistrationRoleFilter(campId, "participant"),
  });

  const getCountry = (registration: Registration): string => {
    const country = registration.campData["country"]?.find((value: unknown) => {
      return typeof value === "string" && countries.includes(value);
    });

    return country ?? "unknown";
  };

  // Count the participants for each country
  return participants.reduce(
    (result, curr) => {
      const country = getCountry(curr);
      result[country] = (result[country] || 0) + 1;
      return result;
    },
    {} as Record<string, number>,
  );
};

type RegistrationCreateData = Pick<
  Prisma.RegistrationCreateInput,
  "waitingList" | "data" | "locale"
>;
const createRegistration = async (camp: Camp, data: RegistrationCreateData) => {
  // TODO The utils was already initialized during validation. Attach it to the request body
  const form = formUtils(camp);
  form.updateData(data.data);
  const campData = form.extractCampData();

  return prisma.$transaction(async (transaction) => {
    const waitingList =
      data.waitingList ?? (await isWaitingList(transaction, camp, campData));
    return transaction.registration.create({
      data: {
        ...data,
        id: ulid(),
        campId: camp.id,
        waitingList,
        campData,
      },
      include: { files: true },
    });
  });
};

const isWaitingList = async (
  transaction: Partial<typeof prisma>,
  camp: Camp,
  campData: Record<string, unknown[]>,
) => {
  // Waiting list only applies to participants
  if (!isParticipant(campData)) {
    return false;
  }

  const filter: Prisma.RegistrationWhereInput[] = [
    createRegistrationRoleFilter(camp.id, "participant"),
  ];

  let maxParticipants = camp.maxParticipants as Record<string, number> | number;
  // Add country filter
  if (typeof maxParticipants !== "number") {
    const country = findCampDataCountry(campData, camp.countries);
    // Add filter criteria for country
    filter.push({
      campData: {
        path: dbJsonPath("country"),
        array_contains: [country],
      },
    });

    // Set country based value as maximum
    maxParticipants = maxParticipants[country];
  }

  const count = await transaction.registration!.count({
    where: { AND: filter },
  });

  return count >= maxParticipants;
};

const isParticipant = (campData: Record<string, unknown[]>): boolean => {
  // If no role is set, it is considered to be participant
  if (!("role" in campData) || campData["role"].length === 0) {
    return true;
  }

  return campData["role"].some((role) => role === "participant");
};

const findCampDataCountry = (
  campData: Record<string, unknown[]>,
  options: string[],
): string => {
  const country = campData["country"]?.find((value) => !!value);
  if (!country || typeof country !== "string") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing country data.");
  }
  if (!options.includes(country)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid country data.");
  }

  return country;
};

const updateRegistrationById = async (
  camp: Camp,
  registrationId: string,
  data: Pick<Prisma.RegistrationUpdateInput, "waitingList" | "data">,
) => {
  // TODO The utils was already initialized during validation. Attach it to the request body
  const form = formUtils(camp);
  form.updateData(data.data);
  const campData = form.extractCampData();

  return prisma.registration.update({
    where: { id: registrationId },
    data: {
      ...data,
      campData,
    },
    include: {
      files: true,
      bed: { include: { room: true } },
    },
  });
};

const deleteRegistrationById = async (registrationId: string) => {
  await prisma.registration.delete({ where: { id: registrationId } });
};

const createRegistrationRoleFilter = (
  campId: string,
  role: string,
): Prisma.RegistrationWhereInput => {
  return {
    campId,
    OR: [
      {
        campData: {
          path: dbJsonPath("role"),
          equals: Prisma.DbNull,
        },
      },
      {
        campData: {
          path: dbJsonPath("role"),
          array_contains: [role],
        },
      },
    ],
  };
};

export default {
  getRegistrationById,
  getParticipantsCountByCountry,
  getParticipantsCount,
  queryRegistrations,
  createRegistration,
  updateRegistrationById,
  deleteRegistrationById,
};
