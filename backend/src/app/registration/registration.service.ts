import prisma from '#client.js';
import { ulid } from '#utils/ulid';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { Camp, Prisma, Registration } from '@prisma/client';
import dbJsonPath from '#utils/dbJsonPath';
import { formUtils } from '#utils/form';
import config from '#config/index';
import { RegistrationCampDataHelper } from '#app/registration/registration.helper.js';

type PrismaTransaction = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

class RegistrationService {
  async getRegistrationById(campId: string, id: string) {
    return prisma.registration.findFirst({
      where: { id, campId },
      include: {
        bed: { include: { room: true } },
      },
    });
  }

  async getRegistrationsByIds(campId: string, ids: string[]) {
    return prisma.registration.findMany({
      where: {
        id: { in: ids },
        campId,
      },
      include: {
        bed: { include: { room: true } },
      },
    });
  }

  async queryRegistrations(campId: string) {
    return prisma.registration.findMany({
      where: { campId },
      include: {
        bed: { include: { room: true } },
      },
    });
  }

  async getParticipantsCount(campId: string) {
    return prisma.registration.count({
      where: registrationRoleFilter(campId, 'participant'),
    });
  }

  async getParticipantsCountByCountry(campId: string, countries: string[]) {
    const participants = await prisma.registration.findMany({
      where: registrationRoleFilter(campId, 'participant'),
    });

    const getCountry = (registration: Registration): string => {
      return (
        new RegistrationCampDataHelper(registration.campData).country(
          countries,
        ) ?? 'unknown'
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
  }

  private validateRegistrationData(
    formHelper: ReturnType<typeof formUtils>,
  ): void | never {
    if (formHelper.hasDataErrors()) {
      const errors = formHelper.getDataErrorFields();

      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid survey data: ${errors}`,
      );
    }

    const unknownDataFields = formHelper.unknownDataFields();
    if (unknownDataFields.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Unknown fields '${unknownDataFields.join(', ')}'`,
      );
    }
  }

  async createRegistration(
    camp: Camp,
    data: Pick<Registration, 'data' | 'locale'>,
  ) {
    const id = ulid();
    const form = formUtils(camp);
    form.updateData(data.data);

    // TODO Should this really be done here?
    //  Can't we do it at a better place?
    this.validateRegistrationData(form);

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

    const freePlaces = this.calculateFreePlaces(camp, campData, 'decrement');
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
      await this.updateCampFreePlaces(camp, freePlaces)(transaction);

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
  }

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
  private calculateFreePlaces(
    camp: Camp,
    campData: Registration['campData'],
    direction: 'increment' | 'decrement',
  ): Camp['freePlaces'] | undefined {
    const updateValue = (val: number) =>
      direction === 'increment' ? ++val : --val;
    let { freePlaces } = { ...camp };

    // Free places only apply to participants
    if (!isParticipant(campData)) {
      return freePlaces;
    }

    // FIXME Check actual count when free places are zero (waiting list)
    if (typeof freePlaces === 'number') {
      // Update free places
      freePlaces = updateValue(freePlaces);

      // Return the updated freePlaces if valid, otherwise undefined
      return freePlaces >= 0 ? freePlaces : undefined;
    }

    const country = new RegistrationCampDataHelper(campData).country(
      camp.countries,
    );

    if (!country || !(country in freePlaces)) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Missing or invalid country data',
      );
    }

    // Update free places for the specific country
    freePlaces[country] = updateValue(freePlaces[country]);

    // Return the updated freePlaces if valid, otherwise undefined
    return freePlaces[country] >= 0 ? freePlaces : undefined;
  }

  private updateCampFreePlaces(camp: Camp, freePlaces: Camp['freePlaces']) {
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
  }

  async updateRegistrationById(
    camp: Camp,
    registrationId: string,
    data: Pick<Prisma.RegistrationUpdateInput, 'waitingList' | 'data'>,
  ) {
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
  }

  async deleteRegistration(camp: Camp, registration: Registration) {
    const freePlaces = this.calculateFreePlaces(
      camp,
      registration.campData,
      'increment',
    );

    await prisma.$transaction(async (transaction) => {
      await this.updateCampFreePlaces(camp, freePlaces)(transaction);
      await prisma.registration.delete({ where: { id: registration.id } });
    });
  }

  async updateRegistrationCampDataByCamp(camp: Camp) {
    const form = formUtils(camp);
    const registrations = await this.queryRegistrations(camp.id);

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

    await Promise.allSettled(results);
  }
}

export default new RegistrationService();

const isParticipant = (campData: Record<string, unknown[]>): boolean => {
  // If no role is set, it is considered to be participant
  if (!('role' in campData) || campData['role'].length === 0) {
    return true;
  }

  return campData['role'].some((role) => role === 'participant');
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
