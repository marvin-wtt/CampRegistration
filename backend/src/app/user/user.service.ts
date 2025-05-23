import type { Prisma, User } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import { encryptPassword } from '#core/encryption';
import type { UserUpdateData } from '@camp-registration/common/entities';
import { BaseService } from '#core/base/BaseService';
import campService from '#app/camp/camp.service';

export class UserService extends BaseService {
  async createUser(
    data: Pick<
      Prisma.UserCreateInput,
      'email' | 'name' | 'password' | 'role' | 'locale' | 'locked'
    >,
  ) {
    if (await this.getUserByEmail(data.email)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }

    return this.prisma.user.create({
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
    return this.prisma.user.findMany({
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
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: { campRoles: true },
    });

    const camps = await campService.getCampsByUserId(id);

    return {
      ...user,
      camps,
    };
  }

  async getUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getUserByIdOrFail(id: string): Promise<User> {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
    });
  }

  async updateUserLastSeenById(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        lastSeen: new Date(),
      },
    });
  }

  async updateUserLastSeenByIdWithCamps(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastSeen: new Date(),
      },
      include: { campRoles: true },
    });

    const camps = await campService.getCampsByUserId(userId);

    return {
      ...user,
      camps,
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
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

    return this.prisma.user.update({
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
      include: { campRoles: true },
    });
  }

  async deleteUserById(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
  }
}

export default new UserService();
