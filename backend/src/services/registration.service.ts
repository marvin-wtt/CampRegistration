import prisma from '../client';
import { ulid } from 'utils/ulid';
import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { Camp, Prisma, Registration } from '@prisma/client';
import dbJsonPath from 'utils/dbJsonPath';
import { formUtils } from 'utils/form';
import { campService, notificationService } from 'services/index';
import i18n, { t } from 'config/i18n';
import { translateObject } from 'utils/translateObject';
import config from 'config';
import AsyncLock from 'async-lock';

// Registration lock
const lock = new AsyncLock({
  timeout: 1e4,
  maxExecutionTime: 2e3,
});

const getRegistrationById = async (campId: string, id: string) => {
  return prisma.registration.findFirst({
    where: { id, campId },
    include: {
      bed: { include: { room: true } },
    },
  });
};

const queryRegistrations = async (campId: string) => {
  return prisma.registration.findMany({
    where: { campId },
    include: {
      bed: { include: { room: true } },
    },
  });
};

const getParticipantsCount = async (campId: string) => {
  return prisma.registration.count({
    where: createRegistrationRoleFilter(campId, 'participant'),
  });
};

const getParticipantsCountByCountry = async (
  campId: string,
  countries: string[],
) => {
  const participants = await prisma.registration.findMany({
    where: createRegistrationRoleFilter(campId, 'participant'),
  });

  const getCountry = (registration: Registration): string => {
    return (
      registrationCampDataAccessor(registration.campData).country(countries) ??
      'unknown'
    );
  };

  // Count the participants for each country
  return participants.reduce(
    (result, curr) => {
      const country = getCountry(curr);
      result[country] = (result[country] || 0) + 1;
      return result;
    },
    {} as Record<string, number>,
  );
};

type RegistrationCreateData = Pick<
  Prisma.RegistrationCreateInput,
  'waitingList' | 'data' | 'locale'
>;
const createRegistration = async (camp: Camp, data: RegistrationCreateData) => {
  const id = ulid();
  const form = formUtils(camp);
  form.updateData(data.data);
  // Extract files first before the value are mapped to the URL
  const fileIds = form.getFileIdentifiers();
  form.mapFileValues((value) => {
    if (typeof value !== 'string') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid file information');
    }
    // The ID may contain the field name. Remove it.
    const fileId = value.split('#')[0];
    return `${config.origin}/api/v1/camps/${camp.id}/registrations/${id}/files/${fileId}/`;
  });
  // Get updated data from form back
  const formData = form.data();
  const campData = form.extractCampData();

  // Use a lock with the camp id as key because we call the camp service and a race condition regarding the waiting list
  //  must be avoided.
  return lock.acquire<Registration>(
    camp.id,
    async (): Promise<Registration> => {
      const waitingList =
        data.waitingList ?? (await isWaitingList(camp, campData));

      return prisma.$transaction(async (transaction) => {
        const registration = await transaction.registration.create({
          data: {
            ...data,
            id,
            campId: camp.id,
            data: formData,
            waitingList,
            campData,
          },
        });

        // Assign files to this registration.
        // TODO This should be handled by the file service
        for (const value of fileIds) {
          await transaction.file.update({
            where: {
              id: value.id,
              registrationId: null,
              campId: null,
              field: value.field ?? null,
            },
            data: {
              registrationId: registration.id,
              accessLevel: 'private',
            },
          });
        }

        return registration;
      });
    },
  );
};

const isWaitingList = async (
  camp: Camp,
  campData: Record<string, unknown[]>,
) => {
  // Waiting list only applies to participants
  if (!isParticipant(campData)) {
    return false;
  }

  const freePlaces = await campService.getCampFreePlaces(camp);
  if (typeof freePlaces !== 'number') {
    const country = registrationCampDataAccessor(campData).country(
      camp.countries,
    );

    if (!country || !(country in freePlaces)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Missing or invalid country data',
      );
    }

    return freePlaces[country] <= 0;
  }

  return freePlaces <= 0;
};

const isParticipant = (campData: Record<string, unknown[]>): boolean => {
  // If no role is set, it is considered to be participant
  if (!('role' in campData) || campData['role'].length === 0) {
    return true;
  }

  return campData['role'].some((role) => role === 'participant');
};

const updateRegistrationById = async (
  camp: Camp,
  registrationId: string,
  data: Pick<Prisma.RegistrationUpdateInput, 'waitingList' | 'data'>,
) => {
  const form = formUtils(camp);
  form.updateData(data.data);
  const campData = form.extractCampData();

  // TODO Delete files if some where removed
  // TODO Associate files if new file values are present

  return prisma.registration.update({
    where: { id: registrationId },
    data: {
      ...data,
      campData,
    },
    include: {
      bed: { include: { room: true } },
    },
  });
};

const deleteRegistrationById = async (registrationId: string) => {
  await prisma.registration.delete({ where: { id: registrationId } });
};

const createRegistrationRoleFilter = (
  campId: string,
  role: string,
): Prisma.RegistrationWhereInput => {
  return {
    campId,
    OR: [
      {
        campData: {
          path: dbJsonPath('role'),
          equals: Prisma.DbNull,
        },
      },
      {
        campData: {
          path: dbJsonPath('role'),
          array_contains: [role],
        },
      },
    ],
  };
};

const sendRegistrationConfirmation = async (
  camp: Camp,
  registration: Registration,
) => {
  const { to, replyTo, campName, participantName } =
    getRegistrationConfirmationRegistrationData(camp, registration);

  await i18n.changeLanguage(registration.locale);
  const subject = t('registration:email.confirmation.subject');
  const template = 'registration-confirmation';

  const context = {
    camp: {
      name: campName,
    },
    participantName,
  };

  await notificationService.sendEmail({
    to,
    replyTo,
    subject,
    template,
    context,
  });
};

const sendWaitingListConfirmation = async (
  camp: Camp,
  registration: Registration,
) => {
  const { to, replyTo, campName, participantName } =
    getRegistrationConfirmationRegistrationData(camp, registration);

  await i18n.changeLanguage(registration.locale);
  const subject = t('registration:email.waitingListConfirmation.subject');
  const template = 'registration-waiting-list-confirmation';

  const context = {
    camp: {
      name: campName,
    },
    participantName,
  };

  await notificationService.sendEmail({
    to,
    replyTo,
    subject,
    template,
    context,
  });
};

const sendRegistrationManagerNotification = async (
  camp: Camp,
  registration: Registration,
) => {
  const accessor = registrationCampDataAccessor(registration.campData);
  const country = accessor.country(camp.countries);

  const to = findCampContactEmails(camp.contactEmail, country);
  const replyTo = accessor.emails();
  const campName = translateObject(camp.name, country);
  const participantName = accessor.name();

  await i18n.changeLanguage(country);
  const subject = t('registration:email.managerNotification.subject');
  const template = 'registration-manager-notification';

  const dataAttachment = {
    filename: 'data.json',
    contentType: 'application/json',
    content: JSON.stringify(registration),
  };

  const context = {
    camp: {
      name: campName,
    },
    participantName,
  };

  await notificationService.sendEmail({
    to,
    replyTo,
    subject,
    template,
    context,
    attachments: [dataAttachment],
  });
};

const getRegistrationConfirmationRegistrationData = (
  camp: Camp,
  registration: Registration,
) => {
  const accessor = registrationCampDataAccessor(registration.campData);

  const to = accessor.emails();
  const country = accessor.country(camp.countries);
  const replyTo = findCampContactEmails(camp.contactEmail, country);
  const participantName = accessor.firstName() ?? accessor.name();
  const campName = translateObject(camp.name, registration.locale);

  return {
    to,
    replyTo,
    participantName,
    campName,
  };
};

const registrationCampDataAccessor = (campData: Record<string, unknown[]>) => {
  const emails = (): string | string[] => {
    return campData['email']?.filter((value): value is string => {
      return !!value && typeof value === 'string';
    });
  };

  const country = (options?: string[]): string | undefined => {
    const country = campData['country']?.find(
      (value: unknown): value is string => {
        return (
          typeof value === 'string' && (!options || options.includes(value))
        );
      },
    );

    if (country) {
      return country;
    }

    // Try address instead
    const address = campData['address']?.find(
      (value: unknown): value is { country: string } => {
        if (!value || typeof value !== 'object' || !('country' in value)) {
          return false;
        }

        return (
          typeof value.country === 'string' &&
          (!options || options.includes(value.country))
        );
      },
    );

    return address?.country;
  };

  const firstName = (): string | undefined => {
    if (!('first_name' in campData) || campData.first_name.length === 0) {
      return undefined;
    }

    return campData.first_name.find((value): value is string => {
      return typeof value === 'string';
    });
  };

  const lastName = (): string | undefined => {
    if (!('last_name' in campData) || campData.last_name.length === 0) {
      return undefined;
    }

    return campData.last_name.find((value): value is string => {
      return typeof value === 'string';
    });
  };

  const fullName = (): string | undefined => {
    if (!('full_name' in campData) || campData.full_name.length === 0) {
      return undefined;
    }

    return campData.full_name.find((value): value is string => {
      return typeof value === 'string';
    });
  };

  const name = (): string | undefined => {
    const full = fullName();
    const first = firstName();
    const last = lastName();

    if (full) {
      return full;
    }

    if (first !== undefined && last !== undefined) {
      return `${first} ${last}`;
    }

    return first !== undefined ? first : last;
  };

  return {
    emails,
    country,
    name,
    firstName,
    lastName,
    fullName,
  };
};

const findCampContactEmails = (
  contactEmail: Record<string, string> | string,
  country: string | undefined,
): string | string[] => {
  if (typeof contactEmail === 'string') {
    return contactEmail;
  }

  if (!country) {
    return Object.values(contactEmail);
  }

  return contactEmail[country];
};

export default {
  getRegistrationById,
  getParticipantsCountByCountry,
  getParticipantsCount,
  queryRegistrations,
  createRegistration,
  updateRegistrationById,
  deleteRegistrationById,
  sendRegistrationConfirmation,
  sendWaitingListConfirmation,
  sendRegistrationManagerNotification,
};
