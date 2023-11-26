import prisma from "../client";
import { ulid } from "@/utils/ulid";
import ApiError from "@/utils/ApiError";
import httpStatus from "http-status";
import { Camp, Prisma } from "@prisma/client";
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

type RegistrationCreateData = Pick<
  Prisma.RegistrationCreateInput,
  "waitingList" | "data"
>;
const createRegistration = async (camp: Camp, data: RegistrationCreateData) => {
  // TODO The utils was already initialized during validation. Attach it to the request body
  const form = formUtils(camp.form);
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
    {
      campId: camp.id,
    },
    {
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
            array_contains: ["participant"],
          },
        },
      ],
    },
  ];

  let maxParticipants = camp.maxParticipants as Record<string, number> | number;
  // Add country filter
  if (typeof maxParticipants !== "number") {
    const country = findCampDataCountry(campData);
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

const findCampDataCountry = (campData: Record<string, unknown[]>): string => {
  const country = campData["country"].find((value) => !!value);
  if (!country || typeof country !== "string") {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Missing country data.",
    );
  }

  return country;
};

const updateRegistrationById = async (
  camp: Camp,
  registrationId: string,
  data: Pick<Prisma.RegistrationUpdateInput, "waitingList" | "data">,
) => {
  // TODO The utils was already initialized during validation. Attach it to the request body
  const form = formUtils(camp.form);
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

export default {
  getRegistrationById,
  queryRegistrations,
  createRegistration,
  updateRegistrationById,
  deleteRegistrationById,
};
