import { type Prisma, User } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../client';
import ApiError from 'utils/ApiError';
import { ulid } from 'utils/ulid';
import { encryptPassword } from 'utils/encryption';
import { authService } from 'services/index';

const createUser = async (
  data: Pick<
    Prisma.UserCreateInput,
    'email' | 'name' | 'password' | 'role' | 'locale'
  >,
) => {
  if (await getUserByEmail(data.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  return prisma.user.create({
    data: {
      id: ulid(),
      name: data.name,
      email: data.email,
      password: await encryptPassword(data.password),
      role: data.role,
      locale: data.locale,
    },
  });
};

const queryUsers = async <Key extends keyof Prisma.UserSelect>(
  filter: Prisma.UserWhereInput,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  },
) => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy;
  const sortType = options.sortType ?? 'desc';

  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      locale: true,
      emailVerified: true,
      role: true,
      locked: true,
      createdAt: true,
    },
  });
};

const getUserByIdWithCamps = (id: string) => {
  return prisma.user.findUnique({
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

const getUserByEmailWithCamps = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
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

const updateUserById = async <Key extends keyof User>(
  userId: string,
  data: Omit<Prisma.UserUpdateInput, 'id'>,
  keys: Key[] = ['id', 'email', 'name', 'role', 'locale', 'locked'] as Key[],
): Promise<Pick<User, Key> | null> => {
  if (data.email && (await getUserByEmail(data.email as string))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (data.locked) {
    await authService.logoutAllDevices(userId);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: data,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
  });
  return updatedUser as Pick<User, Key> | null;
};

type UserUpdateInput = Omit<Prisma.UserUpdateInput, 'id'> & { email?: string };

const updateUserByIdWithCamps = async (
  userId: string,
  data: UserUpdateInput,
) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (data.email) {
    const count = await prisma.user.count({
      where: {
        email: data.email,
      },
    });

    if (count > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
  }

  return prisma.user.update({
    where: { id: user.id },
    data,
    include: {
      camps: {
        include: {
          camp: true,
        },
      },
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
  getUserByIdWithCamps,
  getUserByEmail,
  getUserByEmailWithCamps,
  updateUserById,
  updateUserByIdWithCamps,
  deleteUserById,
};
