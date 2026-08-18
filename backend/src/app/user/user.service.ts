import type { Prisma, User } from '#generated/prisma/client.js';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import { encryptPassword } from '#core/encryption';
import type { UserUpdateData } from '@camp-registration/common/entities';
import { BaseService } from '#core/base/BaseService';
import { CampService } from '#app/camp/camp.service';
import { inject, injectable } from 'inversify';
import type { ProfileUser } from '#app/profile/profile.types';

/**
 * Everything {@link ProfileUser} declares. Every loader that feeds
 * {@link ProfileResource} selects it, so the profile payload cannot differ
 * between login and a later refetch.
 */
const profileAccessInclude = {
  campRoles: true,
  newsletterManagers: true,
  twoFactor: { select: { confirmedAt: true } },
  organizationMembers: {
    include: {
      organization: {
        select: {
          id: true,
          verificationStatus: true,
          // Needed to project organization-derived camp and newsletter access
          // into `campAccess`/`newsletterAccess`, so the client gates UI
          // exactly as the server gates requests.
          camps: { select: { id: true } },
          newsletters: { select: { id: true } },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

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
      include: { twoFactor: { select: { confirmedAt: true } } },
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
        twoFactor: { select: { confirmedAt: true } },
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

  async getProfileUserById(id: string): Promise<ProfileUser> {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: profileAccessInclude,
    });
  }

  /** System administrators, for notifications that need a human moderator. */
  async getAdministrators() {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN', locked: false },
      select: { name: true, email: true, locale: true },
    });
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { twoFactor: { select: { confirmedAt: true } } },
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
      include: profileAccessInclude,
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
      include: profileAccessInclude,
    });
  }

  async deleteUserById(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async resetTwoFactorById(userId: string) {
    // Recovery codes are removed by the cascade
    await this.prisma.userTwoFactor.deleteMany({ where: { userId } });

    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { twoFactor: { select: { confirmedAt: true } } },
    });
  }
}
