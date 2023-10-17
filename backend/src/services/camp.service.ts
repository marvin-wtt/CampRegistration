import { Camp, type Prisma } from "@prisma/client";
import prisma from "../client";
import { ulid } from "@/utils/ulid";

const defaultSelectKeys: (keyof Prisma.CampSelect)[] = [
  "id",
  "active",
  "public",
  "name",
  "countries",
  "organization",
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

const getCampById = (id: string) => {
  return prisma.camp.findFirst({
    where: { id },
  });
};

const getCampsByUserId = async (userId: string) => {
  return prisma.camp.findMany({
    where: {
      campManager: {
        some: { userId },
      },
    },
  });
};

const queryPublicCamps = async <Key extends keyof Camp>(
  filter: {
    userId?: string;
    active?: boolean;
    public?: boolean;
    name?: string;
    age?: number;
    startAt?: Date | string;
    entAt?: Date | string;
    country?: string;
  },
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
  keys: Key[] = defaultSelectKeys as Key[],
) => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? "startAt";
  const sortType = options.sortType ?? "desc";

  const where: Prisma.CampWhereInput = {
    // Only show active, public camps by default
    public: filter.public == false ? undefined : true,
    active: filter.active == false ? undefined : true,
    campManager: { every: { userId: filter.userId } },
    minAge: { lte: filter.age },
    maxAge: { gte: filter.age },
    startAt: { gte: filter.startAt },
    endAt: { lte: filter.entAt },
    countries: { array_contains: filter.country },
  };

  const camps = await prisma.camp.findMany({
    where,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined,
  });

  return camps as Pick<Camp, Key>[];
};

const createCamp = async (
  userId: string,
  data: Omit<Prisma.CampCreateInput, "id">,
) => {
  return prisma.camp.create({
    data: {
      id: ulid(),
      ...data,
      campManager: { create: { userId, id: ulid() } },
    },
  });
};

const updateCampById = async (
  id: string,
  data: Omit<Prisma.CampUpdateInput, "id">,
) => {
  return prisma.camp.update({
    where: { id },
    data,
  });
};

const deleteCampById = async (id: string): Promise<void> => {
  // TODO All files need to be deleted

  await prisma.camp.delete({ where: { id } });
};

export default {
  getCampById,
  getCampsByUserId,
  queryPublicCamps,
  createCamp,
  updateCampById,
  deleteCampById,
};
