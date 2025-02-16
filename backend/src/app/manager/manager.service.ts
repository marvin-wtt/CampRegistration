import prisma from '#client.js';

const campManagerExistsWithUserIdAndCampId = async (
  campId: string,
  userId: string,
): Promise<boolean> => {
  return prisma.campManager
    .findFirst({
      where: {
        campId,
        userId,
      },
    })
    .then((value) => value !== null);
};

const getManagers = async (campId: string) => {
  return prisma.campManager.findMany({
    where: { campId },
    include: {
      invitation: true,
      user: true,
    },
  });
};

const getManagerById = async (campId: string, id: string) => {
  return prisma.campManager.findFirst({
    where: { id, campId },
  });
};

const getManagerByUserId = async (campId: string, userId: string) => {
  return prisma.campManager.findFirst({
    where: { userId, campId },
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

const resolveManagerInvitations = async (email: string, userId: string) => {
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
};

const addManager = async (
  campId: string,
  userId: string,
  expiresAt?: string,
) => {
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
};

const inviteManager = async (
  campId: string,
  email: string,
  expiresAt?: string,
) => {
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
};

const updateManagerById = async (id: string, expiresAt?: string | null) => {
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
  getManagerByUserId,
  addManager,
  inviteManager,
  updateManagerById,
  resolveManagerInvitations,
  campManagerExistsWithUserIdAndCampId,
  removeManager,
};
