import prisma from '#client.js';
import { BaseService } from '#core/BaseService.js';

export class ManagerService extends BaseService {
  async campManagerExistsWithUserIdAndCampId(campId: string, userId: string) {
    return prisma.campManager
      .findFirst({
        where: {
          campId,
          userId,
        },
      })
      .then((value) => value !== null);
  }

  async getManagers(campId: string) {
    return prisma.campManager.findMany({
      where: { campId },
      include: {
        invitation: true,
        user: true,
      },
    });
  }

  async getManagerById(campId: string, id: string) {
    return prisma.campManager.findFirst({
      where: { id, campId },
    });
  }

  async getManagerByUserId(campId: string, userId: string) {
    return prisma.campManager.findFirst({
      where: { userId, campId },
    });
  }

  async getManagerByEmail(campId: string, email: string) {
    return prisma.campManager.findFirst({
      where: {
        campId,
        OR: [{ user: { email } }, { invitation: { email } }],
      },
    });
  }

  async resolveManagerInvitations(email: string, userId: string) {
    await prisma.campManager.updateMany({
      where: {
        invitation: {
          email,
        },
      },
      data: {
        userId,
      },
    });

    await prisma.invitation.deleteMany({
      where: {
        email,
      },
    });
  }

  async addManager(campId: string, userId: string, expiresAt?: string) {
    return prisma.campManager.create({
      data: {
        campId,
        userId,
        expiresAt,
      },
      include: {
        user: true,
        invitation: true,
      },
    });
  }

  async inviteManager(campId: string, email: string, expiresAt?: string) {
    return prisma.campManager.create({
      data: {
        camp: { connect: { id: campId } },
        expiresAt,
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

  async updateManagerById(id: string, expiresAt?: string | null) {
    return prisma.campManager.update({
      where: {
        id,
      },
      data: {
        expiresAt,
      },
      include: {
        invitation: true,
        user: true,
      },
    });
  }

  async removeManager(id: string) {
    return prisma.campManager.delete({
      where: { id },
    });
  }
}

export default new ManagerService();
