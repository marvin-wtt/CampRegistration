import type { Prisma, User } from '#generated/prisma/client.js';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import { encryptPassword } from '#core/encryption';
import type {
  AccountDeletionBlockers,
  UserUpdateData,
} from '@camp-registration/common/entities';
import { BaseService } from '#core/base/BaseService';
import { EventService } from '#app/event/event.service';
import { inject, injectable } from 'inversify';
import type { ProfileUser } from '#app/profile/profile.types';
import { AuditService } from '#app/audit/audit.service';
import type { PrismaTransaction } from '#core/database/transaction';
import { eventManagerAuditPolicy } from '#app/eventManager/event-manager.audit';
import { AccountLifecycle } from '#app/user/account.lifecycle';

const profileAccessInclude = {
  eventRoles: true,
  newsletterManagers: true,
  twoFactor: { select: { confirmedAt: true } },
  organizationMembers: {
    include: {
      organization: {
        select: {
          id: true,
          verificationStatus: true,
          // Needed to project organization-derived event and newsletter access
          // into `eventAccess`/`newsletterAccess`, so the client gates UI
          // exactly as the server gates requests.
          events: { select: { id: true } },
          newsletters: { select: { id: true } },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

const profileAccessOmit = { password: true } satisfies Prisma.UserOmit;

@injectable()
export class UserService extends BaseService {
  constructor(
    @inject(EventService) private readonly eventService: EventService,
    @inject(AuditService) private readonly audit: AuditService,
    @inject(AccountLifecycle)
    private readonly accountLifecycle: AccountLifecycle,
  ) {
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
      omit: profileAccessOmit,
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

  async updateUserLastSeenByIdWithEvents(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastSeen: new Date(),
      },
      omit: profileAccessOmit,
      include: profileAccessInclude,
    });

    const events = await this.eventService.getEventsByUserId(userId);

    return {
      ...user,
      events,
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

    const password = data.password
      ? await encryptPassword(data.password)
      : undefined;
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { email: true },
      });
      const emailChanged =
        data.email !== undefined && data.email !== before.email;

      // Callers reset verification for self-service changes; an admin changing
      // a verified address keeps it verified. Verifying happens below.
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          email: data.email,
          emailVerified: data.emailVerified === false ? false : undefined,
          password,
          role: data.role,
          locale: data.locale,
          locked: data.locked,
        },
        include: { twoFactor: { select: { confirmedAt: true } } },
      });

      let newlyVerified = emailChanged && user.emailVerified;
      if (data.emailVerified === true && !user.emailVerified) {
        // Conditional, so of concurrent verifications only the first fires.
        const { count } = await tx.user.updateMany({
          where: { id: userId, emailVerified: false },
          data: { emailVerified: true },
        });
        newlyVerified = count > 0;
      }

      const result =
        data.emailVerified === true ? { ...user, emailVerified: true } : user;
      if (newlyVerified) {
        await this.accountLifecycle.emailVerified(tx, result);
      }

      return result;
    });
  }

  async deleteUserById(userId: string) {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { eventRoles: true },
      });
      const blockers = await this.getDeletionBlockers(userId, tx);
      const { events, newsletters, organizations } = blockers;
      if (events.length + newsletters.length + organizations.length > 0) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'The account is the only director, owner or administrator of an event, newsletter or organization. Hand it over or delete it first.',
        );
      }

      // The cascade below bypasses `removeManager`, so record it here.
      for (const manager of user.eventRoles) {
        await this.audit.deleted(tx, eventManagerAuditPolicy, manager, {
          details: { reason: 'account_deleted' },
        });
      }
      await this.audit.rememberDeletedUser(tx, user);

      await tx.user.delete({ where: { id: userId } });
    });
  }

  // Mirrors the removal rules: an event keeps a non-expiring director (a
  // pending invitation counts), a newsletter keeps an owner and an
  // organization keeps an administrator (a pending invitation does not).
  async getDeletionBlockers(
    userId: string,
    db: PrismaTransaction = this.prisma,
  ): Promise<AccountDeletionBlockers> {
    const [events, newsletters, organizations] = await Promise.all([
      db.event.findMany({
        select: { id: true, name: true },
        where: {
          eventManager: {
            some: { userId, role: 'DIRECTOR', expiresAt: null },
          },
          NOT: {
            eventManager: {
              some: {
                role: 'DIRECTOR',
                expiresAt: null,
                OR: [{ userId: null }, { userId: { not: userId } }],
              },
            },
          },
        },
      }),
      db.newsletter.findMany({
        select: { id: true, name: true },
        where: {
          managers: { some: { userId, role: 'OWNER' } },
          NOT: {
            managers: { some: { role: 'OWNER', userId: { not: userId } } },
          },
        },
      }),
      db.organization.findMany({
        select: { id: true, name: true },
        where: {
          members: { some: { userId, role: 'ADMIN' } },
          NOT: {
            members: { some: { role: 'ADMIN', userId: { not: userId } } },
          },
        },
      }),
    ]);

    return { events, newsletters, organizations };
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
