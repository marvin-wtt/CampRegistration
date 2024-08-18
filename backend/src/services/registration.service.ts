import prisma from '../client';
import { ulid } from 'utils/ulid';
import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { Camp, Prisma, Registration } from '@prisma/client';
import dbJsonPath from 'utils/dbJsonPath';
import { formUtils } from 'utils/form';
import { messageService, notificationService } from 'services/index';
import config from 'config';
import logger from 'config/logger';

const getRegistrationById = async (campId: string, id: string) => {
  return prisma.registration.findFirst({
    where: { id, campId },
    include: {
      bed: { include: { room: true } },
    },
  });
};

const queryRegistrationsByIds = async (ids: string[]) => {
  return prisma.registration.findMany({
    where: { id: { in: ids } },
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
    where: registrationRoleFilter(campId, 'participant'),
  });
};

const getParticipantsCountByCountry = async (
  campId: string,
  countries: string[],
) => {
  const participants = await prisma.registration.findMany({
    where: registrationRoleFilter(campId, 'participant'),
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

const createRegistration = async (
  camp: Camp,
  data: Pick<Registration, 'data' | 'locale'>,
) => {
  const id = ulid();
  const form = formUtils(camp);
  form.updateData(data.data);
  // Extract files first before the value are mapped to the URL
  const fileIdentifiers = form.getFileIdentifiers();
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

  const freePlaces = await calculateFreePlaces(camp, campData, 'decrement');
  const waitingList = freePlaces === undefined;

  const fileConnects = fileIdentifiers.map((identifier) => {
    return {
      id: identifier.id,
      campId: null,
      registrationId: null,
      accessLevel: 'private',
      field: identifier.field ?? null,
    };
  });

  return prisma.$transaction(async (transaction) => {
    await updateCampFreePlaces(camp, freePlaces)(transaction);

    return transaction.registration.create({
      data: {
        ...data,
        id,
        campId: camp.id,
        data: formData,
        waitingList,
        campData,
        files: {
          connect: fileConnects,
        },
      },
    });
  });
};

/**
 * Calculates the new free places of the camp.
 * Depending on if the data has multiple values or not, the country from the
 * registration camp data is used as key.
 *
 * @param camp The camp related to the registration
 * @param campData The extracted data
 * @param direction Wherever to increment or decrement the free places
 * @return the updated free places or undefined, if there are no free places
 * @throws ApiError if the free places has multiple entries but the country is
 *    missing in the camp data
 */
const calculateFreePlaces = (
  camp: Camp,
  campData: Registration['campData'],
  direction: 'increment' | 'decrement',
): Promise<Camp['freePlaces'] | undefined> => {
  const updateValue = (val: number) =>
    direction === 'increment' ? ++val : --val;
  let { freePlaces } = { ...camp };

  // Free places only apply to participants
  if (!isParticipant(campData)) {
    return freePlaces;
  }

  if (typeof freePlaces === 'number') {
    // Update free places
    freePlaces = updateValue(freePlaces);

    // Return the updated freePlaces if valid, otherwise undefined
    return freePlaces >= 0 ? freePlaces : undefined;
  }

  const country = registrationCampDataAccessor(campData).country(
    camp.countries,
  );

  if (!country || !(country in freePlaces)) {
    throw new ApiError(httpStatus.CONFLICT, 'Missing or invalid country data');
  }

  // Update free places for the specific country
  freePlaces[country] = updateValue(freePlaces[country]);

  // Return the updated freePlaces if valid, otherwise undefined
  return freePlaces[country] >= 0 ? freePlaces : undefined;
};

type PrismaTransaction = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

const updateCampFreePlaces = (camp: Camp, freePlaces: Camp['freePlaces']) => {
  return async (transaction: PrismaTransaction) => {
    return transaction.camp.update({
      data: {
        freePlaces,
      },
      where: {
        id: camp.id,
        version: camp.version,
      },
    });
  };
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
  let campData;
  if (data.data) {
    const form = formUtils(camp);
    form.updateData(data.data);
    campData = form.extractCampData();
  }

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

const deleteRegistration = async (camp: Camp, registration: Registration) => {
  const freePlaces = calculateFreePlaces(
    camp,
    registration.campData,
    'increment',
  );

  await prisma.$transaction(async (transaction) => {
    await updateCampFreePlaces(camp, freePlaces)(transaction);
    await prisma.registration.delete({ where: { id: registration.id } });
  });
};

const updateRegistrationCampDataByCamp = async (camp: Camp): Promise<void> => {
  const form = formUtils(camp);
  const registrations = await queryRegistrations(camp.id);

  const results = registrations.map((registration) => {
    form.updateData(registration.data);
    const campData = form.extractCampData();

    return prisma.registration.update({
      where: { id: registration.id },
      data: {
        campData,
      },
      include: {
        bed: { include: { room: true } },
      },
    });
  });

  await Promise.all(results);
};

const registrationRoleFilter = (
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
  await sendMessageByTemplate('registration_confirmation', camp, registration);
};

const sendWaitingListConfirmation = async (
  camp: Camp,
  registration: Registration,
) => {
  await sendMessageByTemplate('waiting_list_notification', camp, registration);
};

const sendRegistrationManagerNotification = async (
  camp: Camp,
  registration: Registration,
) => {
  // Swap recipients and replyTo as the message is not sent to the registration
  const {
    recipients: replyTo,
    replyTo: recipients,
    country,
  } = getRegistrationConfirmationRegistrationData(camp, registration);
  const name = 'registration_notification';

  const template = await messageService.getMessageTemplate(
    camp.id,
    name,
    country,
  );

  if (!template) {
    logger.warn(
      `No message template found with name '${name}' for camp '${camp.id}'. Locale: '${country}'`,
    );
    return;
  }

  const url = notificationService.generateUrl(`management/${camp.id}`);
  const context = {
    camp,
    registration,
    url,
  };

  const dataAttachment = {
    filename: 'data.json',
    contentType: 'application/json',
    content: JSON.stringify(registration),
  };

  await messageService.sendMessageWithTemplate(template, {
    recipients,
    replyTo: Array.isArray(replyTo) ? replyTo.join(',') : replyTo,
    context,
    attachments: [dataAttachment],
  });
};

const sendMessageByTemplate = async (
  name: string,
  camp: Camp,
  registration: Registration,
) => {
  const { recipients, replyTo, country } =
    getRegistrationConfirmationRegistrationData(camp, registration);

  const template = await messageService.getMessageTemplate(
    camp.id,
    name,
    country,
  );

  if (!template) {
    logger.warn(
      `No message template found with name '${name}' for camp '${camp.id}'. Locale: '${country}'`,
    );
    return;
  }

  const context = {
    camp,
    registration,
  };

  await messageService.sendMessageWithTemplate(template, {
    context,
    recipients,
    replyTo,
  });
};

const getRegistrationConfirmationRegistrationData = (
  camp: Camp,
  registration: Registration,
) => {
  const accessor = registrationCampDataAccessor(registration.campData);

  const recipients = accessor.emails();
  const country = accessor.country(camp.countries);
  const replyTo = findCampContactEmails(camp.contactEmail, country);

  return {
    recipients,
    replyTo,
    country,
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

  return {
    emails,
    country,
  };
};

const findCampContactEmails = (
  contactEmail: Record<string, string> | string,
  country: string | undefined,
): string => {
  if (typeof contactEmail === 'string') {
    return contactEmail;
  }

  if (!country) {
    return Object.values(contactEmail).join(',');
  }

  return contactEmail[country];
};

const extractRegistrationCountry = (
  registration: Registration,
): string | undefined => {
  return registrationCampDataAccessor(registration.campData).country();
};

const extractRegistrationEmails = (
  registration: Registration,
): string[] | string => {
  return registrationCampDataAccessor(registration.campData).emails();
};

export default {
  getRegistrationById,
  getParticipantsCountByCountry,
  getParticipantsCount,
  queryRegistrations,
  queryRegistrationsByIds,
  createRegistration,
  updateRegistrationById,
  deleteRegistration,
  updateRegistrationCampDataByCamp,
  sendRegistrationConfirmation,
  sendWaitingListConfirmation,
  sendRegistrationManagerNotification,
  extractRegistrationCountry,
  extractRegistrationEmails,
};
