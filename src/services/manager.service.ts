import prisma from "../client";
import { randomUUID } from "crypto";
import { ulid } from "../utils/ulid";

const campManagerExistsWithUserIdAndCampId = async (
  campId: string,
  userId: string
): Promise<boolean> => {
  return await prisma.campManager
    .findFirst({
      where: { campId, userId },
    })
    .then((value) => value !== null);
};

const getManagers = async (campId: string) => {
  return prisma.campManager.findMany({
    where: { campId },
    include: {
      invitation: true,
      user: true
    },
  });
};

const getManagerById = async (campId: string, id: string) => {
  return prisma.campManager.findFirst({
    where: { id, campId },
  });
};

const getManagerByEmail = async (campId: string, email: string) => {
  return prisma.campManager.findFirst({
    where: {
      campId,
      OR: [{ user: { email } }, { invitation: { email } }],
    },
  });
};

const acceptManagerInvitation = async (
  managerId: string,
  userId: string
) => {
  return prisma.campManager.update({
    where: { id: managerId },
    data: {
      invitation: { delete: true },
      user: { connect: { id: userId } },
    },
    include: {
      invitation: true,
      user: true,
    }
  });
};

const inviteManager = async (campId: string, email: string) => {
  return prisma.campManager.create({
    data: {
      id: ulid(),
      camp: { connect: { id: campId } },
      invitation: {
        create: {
          id: ulid(),
          email,
          token: randomUUID(),
        },
      },
    },
    include: {
      invitation: true,
      user: true,
    },
  });
};

const removeManager = async (id: string) => {
  return prisma.campManager.delete({
    where: { id },
  });
};

export default {
  getManagers,
  getManagerByEmail,
  getManagerById,
  acceptManagerInvitation,
  inviteManager,
  campManagerExistsWithUserIdAndCampId,
  removeManager,
};
