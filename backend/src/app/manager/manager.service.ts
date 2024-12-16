import prisma from '../../client.js';
import { ulid } from '#utils/ulid';
import { Camp, CampManager, Invitation, User } from '@prisma/client';
import { translateObject } from '#utils/translateObject';
import i18n, { t } from '#config/i18n';
import notificationService from '#app/notification/notification.service';

const campManagerExistsWithUserIdAndCampId = async (
  campId: string,
  userId: string,
): Promise<boolean> => {
  return prisma.campManager
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
      user: true,
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

const addManager = async (campId: string, userId: string) => {
  return prisma.campManager.create({
    data: {
      id: ulid(),
      campId,
      userId,
    },
    include: {
      user: true,
      invitation: true,
    },
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

type CampManagerWithUserOrInvitation = CampManager & { user: User | null } & {
  invitation: Invitation | null;
};

const sendManagerInvitation = async (
  camp: Camp,
  manager: CampManagerWithUserOrInvitation,
) => {
  const user = manager.user;
  const to = user?.email ?? manager.invitation?.email;

  /* c8-ignore-next */
  if (!to) {
    return;
  }

  const campName = translateObject(camp.name, user?.locale);
  const userName = user?.name;
  const url = notificationService.generateUrl(`management/${camp.id}/`);

  const locale =
    user?.locale ?? (camp.countries.length === 1 ? camp.countries[0] : 'en');
  await i18n.changeLanguage(locale);
  const subject = t('manager:email.invitation.subject');
  const template = 'manager-invitation';

  const context = {
    camp: {
      name: campName,
    },
    userName,
    url,
  };

  await notificationService.sendEmail({
    to,
    subject,
    template,
    context,
  });
};

export default {
  getManagers,
  getManagerByEmail,
  getManagerById,
  addManager,
  inviteManager,
  resolveManagerInvitations,
  campManagerExistsWithUserIdAndCampId,
  removeManager,
  sendManagerInvitation,
};
