import { BaseService } from '#core/base/BaseService';
import type { Prisma } from '@prisma/client';

type ManagerCreateData = Pick<
  Prisma.CampManagerCreateInput,
  'role' | 'expiresAt'
>;

type ManagerUpdateData = Pick<
  Prisma.CampManagerUpdateInput,
  'role' | 'expiresAt'
>;

export class ManagerService extends BaseService {
  async campManagerExistsWithUserIdAndCampId(campId: string, userId: string) {
    return this.prisma.campManager
      .findFirst({
        where: {
          campId,
          userId,
        },
      })
      .then((value) => value !== null);
  }

  async getManagers(campId: string) {
    return this.prisma.campManager.findMany({
      where: { campId },
      include: {
        invitation: true,
        user: true,
      },
    });
  }

  async getManagerById(campId: string, id: string) {
    return this.prisma.campManager.findFirst({
      where: { id, campId },
    });
  }

  async getManagerByUserId(campId: string, userId: string) {
    return this.prisma.campManager.findFirst({
      where: { userId, campId },
    });
  }

  async getManagerByEmail(campId: string, email: string) {
    return this.prisma.campManager.findFirst({
      where: {
        campId,
        OR: [{ user: { email } }, { invitation: { email } }],
      },
    });
  }

  async resolveManagerInvitations(email: string, userId: string) {
    await this.prisma.campManager.updateMany({
      where: {
        invitation: {
          email,
        },
      },
      data: {
        userId,
      },
    });

    await this.prisma.invitation.deleteMany({
      where: {
        email,
      },
    });
  }

  async addManager(campId: string, userId: string, data: ManagerCreateData) {
    return this.prisma.campManager.create({
      data: {
        campId,
        userId,
        role: data.role,
        expiresAt: data.expiresAt,
      },
      include: {
        user: true,
        invitation: true,
      },
    });
  }

  async inviteManager(campId: string, email: string, data: ManagerCreateData) {
    return this.prisma.campManager.create({
      data: {
        camp: { connect: { id: campId } },
        role: data.role,
        expiresAt: data.expiresAt,
        invitation: {
          create: {
            email,
          },
        },
      },
      include: {
        invitation: true,
        user: true,
      },
    });
  }

  async updateManagerById(id: string, data: ManagerUpdateData) {
    return this.prisma.campManager.update({
      where: {
        id,
      },
      data: {
        role: data.role,
        expiresAt: data.expiresAt,
      },
      include: {
        invitation: true,
        user: true,
      },
    });
  }

  async removeManager(id: string) {
    return this.prisma.campManager.delete({
      where: { id },
    });
  }
}

export default new ManagerService();
