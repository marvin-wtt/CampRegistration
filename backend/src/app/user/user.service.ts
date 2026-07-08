import type { Prisma, User } from '#generated/prisma/client.js';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import { encryptPassword } from '#core/encryption';
import type { UserUpdateData } from '@camp-registration/common/entities';
import { BaseService } from '#core/base/BaseService';
import { CampService } from '#app/camp/camp.service';
import { inject, injectable } from 'inversify';

@injectable()
export class UserService extends BaseService {
  constructor(@inject(CampService) private readonly campService: CampService) {
    super();
  }

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

  private userWhere(
    filter: {
      search?: string;
      name?: string;
      email?: string;
      role?: Prisma.UserWhereInput['role'];
      status?: 'active' | 'locked' | 'unverified';
    } = {},
  ): Prisma.UserWhereInput {
    const status: Prisma.UserWhereInput =
      filter.status === 'locked'
        ? { locked: true }
        : filter.status === 'unverified'
          ? { emailVerified: false }
          : filter.status === 'active'
            ? { locked: false, emailVerified: true }
            : {};

    return {
      ...(filter.search
        ? {
            OR: [
              { name: { contains: filter.search } },
              { email: { contains: filter.search } },
            ],
          }
        : {}),
      name: filter.name ? { contains: filter.name } : undefined,
      email: filter.email ? { contains: filter.email } : undefined,
      role: filter.role,
      ...status,
    };
  }

  async queryUsers(
    filter: {
      search?: string;
      name?: string;
      email?: string;
      role?: Prisma.UserWhereInput['role'];
      status?: 'active' | 'locked' | 'unverified';
    } = {},
    options: {
      limit?: number;
      cursor?: string;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    } = {},
  ) {
    const limit = options.limit ?? 25;
    const sortBy = options.sortBy ?? 'lastSeen';
    const sortType = options.sortType ?? 'desc';

    const where = this.userWhere(filter);

    const items = await this.prisma.user.findMany({
      where,
      take: limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      orderBy: [{ [sortBy]: sortType }, { id: sortType }],
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

    const hasMore = items.length > limit;
    const users = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? (users[users.length - 1]?.id ?? null) : null;
    const total = options.cursor
      ? undefined
      : await this.prisma.user.count({ where });

    return { users, nextCursor, limit, total };
  }

  async getOverviewCounts() {
    const [total, unverified, locked] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { emailVerified: false } }),
      this.prisma.user.count({ where: { locked: true } }),
    ]);

    return { total, unverified, locked };
  }

  async getUserByIdWithCampRoles(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: { campRoles: true },
    });
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

    const camps = await this.campService.getCampsByUserId(userId);

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
