import { Camp, type Prisma } from "@prisma/client";
import prisma from "../client";
import { orderedUuid } from "../utils/uuid";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";

const defaultSelectKeys: (keyof Prisma.CampSelect)[] = [
  "id",
  "public",
  "name",
  "maxParticipants",
  "minAge",
  "maxAge",
  "startAt",
  "endAt",
  "price",
  "location",
  "form",
  "createdAt",
  "updatedAt",
];

const getCampById = async <Key extends keyof Camp>(
  id: string,
  keys: Key[] = defaultSelectKeys as Key[]
): Promise<Pick<Camp, Key> | null> => {
  return prisma.camp.findFirst({
    where: { id },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
  }) as Promise<Pick<Camp, Key> | null>;
};

const getCampsByUserId = async (userId: string) => {
  return prisma.camp.findMany({
    where: {
      campManager: {
        some: {
          userId: userId
        }
      }
    },
  });
};

const queryPublicCamps = async <Key extends keyof Camp>(
  filter: Prisma.CampWhereInput,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
  keys: Key[] = defaultSelectKeys as Key[]
) => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? "startAt";
  const sortType = options.sortType ?? "desc";
  const camps = await prisma.camp.findMany({
    where: filter,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    skip: page * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined,
  });

  return camps as Pick<Camp, Key>[];
};

const createCamp = async (
  userId: string,
  data: Omit<Prisma.CampCreateInput, "id">
): Promise<Camp> => {
  return prisma.camp.create({
    data: {
      id: orderedUuid(),
      ...data,
      campManager: {
        create: {
          userId: userId,
        },
      },
    },
  });
};

const updateCampById = async <Key extends keyof Camp>(
  campId: string,
  updateBody: Omit<Prisma.CampUpdateInput, "id">,
  keys: Key[] = defaultSelectKeys as Key[]
): Promise<Pick<Camp, Key> | null> => {
  const camp = await getCampById(campId);
  if (!camp) {
    throw new ApiError(httpStatus.NOT_FOUND, "Camp not found");
  }
  const updatedUser = await prisma.camp.update({
    where: { id: camp.id },
    data: updateBody,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
  });
  return updatedUser as Pick<Camp, Key> | null;
};

const deleteCampById = async (campId: string): Promise<Camp> => {
  const camp = await getCampById(campId);
  if (!camp) {
    throw new ApiError(httpStatus.NOT_FOUND, "Camp not found");
  }
  await prisma.camp.delete({ where: { id: camp.id } });
  return camp;
};

export default {
  getCampById,
  getCampsByUserId,
  queryPublicCamps,
  createCamp,
  updateCampById,
  deleteCampById,
};
