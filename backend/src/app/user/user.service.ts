import type { Prisma, User } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '#client.js';
import ApiError from '#utils/ApiError';
import { encryptPassword } from '#utils/encryption';
import type { UserUpdateData } from '@camp-registration/common/entities';

const createUser = async (
  data: Pick<
    Prisma.UserCreateInput,
    'email' | 'name' | 'password' | 'role' | 'locale' | 'locked'
  >,
) => {
  if (await getUserByEmail(data.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: await encryptPassword(data.password),
      role: data.role,
      locale: data.locale,
    },
  });
};

const queryUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      locale: true,
      emailVerified: true,
      role: true,
      locked: true,
      lastSeen: true,
      createdAt: true,
    },
  });
};

const getUserByIdWithCamps = (id: string) => {
  return prisma.user.findUniqueOrThrow({
    where: { id },
    include: {
      camps: {
        include: { camp: true },
      },
    },
  });
};

const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
  });
};

const getUserByIdOrFail = async (id: string): Promise<User> => {
  return prisma.user.findUniqueOrThrow({
    where: { id },
  });
};

const updateUserLastSeenById = async (userId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      lastSeen: new Date(),
    },
  });
};

const updateUserLastSeenByIdWithCamps = async (userId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      lastSeen: new Date(),
    },
    include: {
      camps: {
        include: { camp: true },
      },
    },
  });
};

const getUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
  });
};

const updateUserById = async (userId: string, data: UserUpdateData) => {
  // Verify email not taken yet
  if (data.email !== undefined) {
    const user = await getUserByEmail(data.email);

    if (user && user.id !== userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email,
      emailVerified: data.emailVerified,
      password: data.password
        ? await encryptPassword(data.password)
        : undefined,
      role: data.role,
      locale: data.locale,
      locked: data.locked,
    },
  });
};

const deleteUserById = async (userId: string) => {
  await prisma.user.delete({ where: { id: userId } });
};

export default {
  createUser,
  queryUsers,
  getUserById,
  getUserByIdOrFail,
  getUserByIdWithCamps,
  getUserByEmail,
  updateUserById,
  updateUserLastSeenById,
  updateUserLastSeenByIdWithCamps,
  deleteUserById,
};
