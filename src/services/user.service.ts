import {User, type Prisma, Camp, CampManager} from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";
import { orderedUuid } from "../utils/uuid";

export interface UserWithCamps extends User {
  camps: CampManager[];
}

const createUser = async (
  data: Pick<Prisma.UserCreateInput, "email" | "name" | "password" | "role">
): Promise<User> => {
  if (await getUserByEmail(data.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  return prisma.user.create({
    data: {
      id: orderedUuid(),
      ...data,
    },
  });
};

const queryUsers = async <Key extends keyof Prisma.UserSelect>(
  filter: Prisma.UserWhereInput,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
  keys: Key[] = [
    "id",
    "email",
    "name",
    "password",
    "createdAt",
    "updatedAt",
  ] as Key[]
): Promise<Pick<Prisma.UserSelect, Key>[]> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy;
  const sortType = options.sortType ?? "desc";
  const users = await prisma.user.findMany({
    where: filter,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    skip: page * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined,
  });

  return users as Pick<Prisma.UserSelect, Key>[];
};

const getUserByIdWithCamps = (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      camps: {
        include: {
          camp: true
        }
      },
    },
  });
};

const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
  });
};

const getUserByEmailWithCamps = async (
  email: string
) => {
  return prisma.user.findUnique({
    where: { email },
    include: {
      camps: {
        include: {
          camp: true
        }
      },
    },
  });
};

const getUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
  });
};

const updateUserById = async <Key extends keyof User>(
  userId: string,
  updateBody: Omit<Prisma.UserUpdateInput, "id">,
  keys: Key[] = ["id", "email", "name", "role"] as Key[]
): Promise<Pick<User, Key> | null> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (updateBody.email && (await getUserByEmail(updateBody.email as string))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateBody,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
  });
  return updatedUser as Pick<User, Key> | null;
};

const updateUserByIdWithCamps = async (
  userId: string,
  updateBody: Omit<Prisma.UserUpdateInput, "id">,
) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (updateBody.email && (await getUserByEmail(updateBody.email as string))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  return prisma.user.update({
    where: { id: user.id },
    data: updateBody,
    include: {
      camps: {
        include: {
          camp: true
        }
      }
    },
  });
}


const deleteUserById = async (userId: string): Promise<User> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await prisma.user.delete({ where: { id: user.id } });
  return user;
};

export default {
  createUser,
  queryUsers,
  getUserById,
  getUserByIdWithCamps,
  getUserByEmail,
  getUserByEmailWithCamps,
  updateUserById,
  updateUserByIdWithCamps,
  deleteUserById,
};
