import { Camp, type Prisma } from "@prisma/client";
import prisma from "../client";
import { ulid } from "@/utils/ulid";
import { objectValueByPath } from "@/utils/objectValueByPath";
import { formUtils } from "@/utils/form";
import dbJsonPath from "@/utils/dbJsonPath";

const defaultSelectKeys: (keyof Prisma.CampSelect)[] = [
  "id",
  "active",
  "public",
  "name",
  "countries",
  "organization",
  "contactEmail",
  "maxParticipants",
  "minAge",
  "maxAge",
  "startAt",
  "endAt",
  "price",
  "location",
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
  data: Omit<Prisma.CampCreateInput, "id" | "accessors">,
) => {
  // TODO This was already done in validation. How to cache / reuse it?
  const form = formUtils(data.form);

  return prisma.camp.create({
    data: {
      id: ulid(),
      ...data,
      accessors: form.extractAccessors(),
      campManager: { create: { userId, id: ulid() } },
    },
  });
};

const updateCampById = async (
  id: string,
  data: Omit<Prisma.CampUpdateInput, "id">,
) => {
  // TODO This was already done in validation. How to cache / reuse it?
  const form = formUtils(data.form);

  return prisma.camp.update({
    where: { id },
    data: {
      ...data,
      accessors: form.extractAccessors(),
    },
  });
};

const deleteCampById = async (id: string): Promise<void> => {
  // TODO All files need to be deleted

  await prisma.camp.delete({ where: { id } });
};

const getCampFreePlaces = async (
  camp: Camp,
): Promise<number | Record<string, number>> => {
  const countries = Array.isArray(camp.countries) ? camp.countries : [];
  const campAccessors = camp.accessors as Record<string, (string | number)[][]>;
  const freeSpaces = camp.maxParticipants as Record<string, number> | number;

  const rolePath = dbJsonPath("role", campAccessors);
  const whereRole = rolePath
    ? { path: rolePath, equals: "participant" }
    : undefined;

  const where = {
    campId: camp.id,
    data: whereRole,
  };

  if (countries.length === 1 || typeof freeSpaces === "number") {
    return prisma.registration.count({
      where,
    });
  }

  const registrations = await prisma.registration.findMany({
    select: {
      data: true,
    },
    where,
  });

  const getRegistrationCountry = (
    path: string,
    data: unknown,
  ): string | undefined => {
    const value = objectValueByPath(path, data);

    if (typeof value !== "string") {
      return undefined;
    }
    return value;
  };

  for (const registration of registrations) {
    const country =
      getRegistrationCountry("country", registration.data) ?? "unknown"; // TODO Access country

    if (country === "unknown") {
      console.log(registration);
    }

    if (!(country in freeSpaces)) {
      freeSpaces[country] ??= 0;
    }

    freeSpaces[country]--;
  }

  return freeSpaces;
};

export default {
  getCampById,
  getCampsByUserId,
  getCampFreePlaces,
  queryPublicCamps,
  createCamp,
  updateCampById,
  deleteCampById,
};
