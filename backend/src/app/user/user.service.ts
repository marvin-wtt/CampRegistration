import type { Prisma, User } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '#client.js';
import ApiError from '#utils/ApiError';
import { encryptPassword } from '#utils/encryption';
import type { UserUpdateData } from '@camp-registration/common/entities';

class UserService {
  async createUser(
    data: Pick<
      Prisma.UserCreateInput,
      'email' | 'name' | 'password' | 'role' | 'locale' | 'locked'
    >,
  ) {
    if (await this.getUserByEmail(data.email)) {
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
  }

  async queryUsers() {
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
  }

  async getUserByIdWithCamps(id: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        camps: {
          include: { camp: true },
        },
      },
    });

    return {
      ...user,
      camps: user.camps.map((manager) => manager.camp),
    };
  }

  async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async getUserByIdOrFail(id: string): Promise<User> {
    return prisma.user.findUniqueOrThrow({
      where: { id },
    });
  }

  async updateUserLastSeenById(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastSeen: new Date(),
      },
    });
  }

  async updateUserLastSeenByIdWithCamps(userId: string) {
    const user = await prisma.user.update({
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

    return {
      ...user,
      camps: user.camps.map((manager) => manager.camp),
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async updateUserById(userId: string, data: UserUpdateData) {
    // Verify email not taken yet
    if (data.email !== undefined) {
      const user = await this.getUserByEmail(data.email);

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
  }

  async deleteUserById(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
  }
}

export default new UserService();
