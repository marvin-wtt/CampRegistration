import prisma from "../client";
import { ulid } from "utils/ulid";
import ApiError from "utils/ApiError";
import httpStatus from "http-status";
import { Camp, Prisma, Registration } from "@prisma/client";
import dbJsonPath from "utils/dbJsonPath";
import { formUtils } from "utils/form";
import { notificationService } from "services/index";
import i18n, { t } from "config/i18n";
import { translateObject } from "utils/translateObject";

const getRegistrationById = async (campId: string, id: string) => {
  return prisma.registration.findFirst({
    where: { id, campId },
    include: {
      files: true,
      bed: { include: { room: true } },
    },
  });
};

const queryRegistrations = async (campId: string) => {
  return prisma.registration.findMany({
    where: { campId },
    include: {
      files: true,
      bed: { include: { room: true } },
    },
  });
};

const getParticipantsCount = async (campId: string) => {
  return prisma.registration.count({
    where: createRegistrationRoleFilter(campId, "participant"),
  });
};

const getParticipantsCountByCountry = async (
  campId: string,
  countries: string[],
) => {
  const participants = await prisma.registration.findMany({
    where: createRegistrationRoleFilter(campId, "participant"),
  });

  const getCountry = (registration: Registration): string => {
    const country = registration.campData["country"]?.find((value: unknown) => {
      return typeof value === "string" && countries.includes(value);
    });

    return country ?? "unknown";
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
  "waitingList" | "data" | "locale"
>;
const createRegistration = async (camp: Camp, data: RegistrationCreateData) => {
  // TODO The utils was already initialized during validation. Attach it to the request body
  const form = formUtils(camp);
  form.updateData(data.data);
  const campData = form.extractCampData();

  return prisma.$transaction(async (transaction) => {
    const waitingList =
      data.waitingList ?? (await isWaitingList(transaction, camp, campData));
    return transaction.registration.create({
      data: {
        ...data,
        id: ulid(),
        campId: camp.id,
        waitingList,
        campData,
      },
      include: { files: true },
    });
  });
};

const isWaitingList = async (
  transaction: Partial<typeof prisma>,
  camp: Camp,
  campData: Record<string, unknown[]>,
) => {
  // Waiting list only applies to participants
  if (!isParticipant(campData)) {
    return false;
  }

  const filter: Prisma.RegistrationWhereInput[] = [
    createRegistrationRoleFilter(camp.id, "participant"),
  ];

  let maxParticipants = camp.maxParticipants as Record<string, number> | number;
  // Add country filter
  if (typeof maxParticipants !== "number") {
    const country = registrationCampDataAccessor(campData).country(
      camp.countries,
    );
    if (!country) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Missing or invalid country data",
      );
    }

    // Add filter criteria for country
    filter.push({
      campData: {
        path: dbJsonPath("country"),
        array_contains: [country],
      },
    });

    // Set country based value as maximum
    maxParticipants = maxParticipants[country];
  }

  const count = await transaction.registration!.count({
    where: { AND: filter },
  });

  return count >= maxParticipants;
};

const isParticipant = (campData: Record<string, unknown[]>): boolean => {
  // If no role is set, it is considered to be participant
  if (!("role" in campData) || campData["role"].length === 0) {
    return true;
  }

  return campData["role"].some((role) => role === "participant");
};

const updateRegistrationById = async (
  camp: Camp,
  registrationId: string,
  data: Pick<Prisma.RegistrationUpdateInput, "waitingList" | "data">,
) => {
  // TODO The utils was already initialized during validation. Attach it to the request body
  const form = formUtils(camp);
  form.updateData(data.data);
  const campData = form.extractCampData();

  return prisma.registration.update({
    where: { id: registrationId },
    data: {
      ...data,
      campData,
    },
    include: {
      files: true,
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
          path: dbJsonPath("role"),
          equals: Prisma.DbNull,
        },
      },
      {
        campData: {
          path: dbJsonPath("role"),
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
  const { to, replyTo, cc, campName, participantName } =
    getRegistrationConfirmationRegistrationData(camp, registration);

  await i18n.changeLanguage(registration.locale);
  const subject = t("registration:email.confirmation.subject");
  const template = "registration-confirmation";

  const context = {
    camp: {
      name: campName,
    },
    participantName,
  };

  notificationService.sendEmail({
    to,
    cc,
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
  const { to, replyTo, cc, campName, participantName } =
    getRegistrationConfirmationRegistrationData(camp, registration);

  await i18n.changeLanguage(registration.locale);
  const subject = t("registration:email.waitingListConfirmation.subject");
  const template = "registration-waiting-list-confirmation";

  const context = {
    camp: {
      name: campName,
    },
    participantName,
  };

  notificationService.sendEmail({
    to,
    cc,
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
  const campName = translateObject(camp.name, country);
  const participantName = accessor.name();

  await i18n.changeLanguage(country);
  const subject = t("registration:email.managerNotification.subject");
  const template = "registration-manager-notification";

  const dataAttachment = {
    filename: "data.json",
    contentType: "application/json",
    content: JSON.stringify(registration),
  };

  const context = {
    camp: {
      name: campName,
    },
    participantName,
  };

  notificationService.sendEmail({
    to,
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
  const cc = accessor.guardianEmails();
  const country = accessor.country(camp.countries);
  const replyTo = findCampContactEmails(camp.contactEmail, country);
  const participantName = accessor.firstName() ?? accessor.name();
  const campName = translateObject(camp.name, registration.locale);

  return {
    to,
    cc,
    replyTo,
    participantName,
    campName,
  };
};

const registrationCampDataAccessor = (campData: Record<string, unknown[]>) => {
  const emails = (): string | string[] => {
    return campData["email"]?.filter((value): value is string => {
      return !!value && typeof value === "string";
    });
  };

  const country = (options?: string[]): string | undefined => {
    return campData["country"]?.find((value: unknown): value is string => {
      return typeof value === "string" && (!options || options.includes(value));
    });
  };

  const firstName = (): string | undefined => {
    if (!("first_name" in campData) || campData.first_name.length === 0) {
      return undefined;
    }

    return campData.first_name.find((value): value is string => {
      return typeof value === "string";
    });
  };

  const lastName = (): string | undefined => {
    if (!("last_name" in campData) || campData.last_name.length === 0) {
      return undefined;
    }

    return campData.last_name.find((value): value is string => {
      return typeof value === "string";
    });
  };

  const fullName = (): string | undefined => {
    if (!("full_name" in campData) || campData.full_name.length === 0) {
      return undefined;
    }

    return campData.full_name.find((value): value is string => {
      return typeof value === "string";
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

  const guardianEmails = (): string[] => {
    const emails = campData["guardian_email"]?.filter(
      (value): value is string => {
        return !!value && typeof value === "string";
      },
    );

    return emails ?? [];
  };

  return {
    emails,
    country,
    name,
    firstName,
    lastName,
    fullName,
    guardianEmails,
  };
};

const findCampContactEmails = (
  contactEmail: Record<string, string> | string,
  country: string | undefined,
): string | string[] => {
  if (typeof contactEmail === "string") {
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
