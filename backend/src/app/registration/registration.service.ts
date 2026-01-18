import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { type Camp, Prisma, type Registration } from '@prisma/client';
import { formUtils } from '#utils/form';
import { BaseService } from '#core/base/BaseService';
import { RegistrationCampDataHelper } from '#app/registration/registration.helper';
import { injectable } from 'inversify';

@injectable()
export class RegistrationService extends BaseService {
  async getRegistrationById(campId: string, id: string) {
    return this.prisma.registration.findFirst({
      where: { id, campId },
      include: {
        bed: { include: { room: true } },
      },
    });
  }

  async getRegistrationsByIds(campId: string, ids: string[]) {
    return this.prisma.registration.findMany({
      where: {
        id: { in: ids },
        campId,
      },
      include: {
        bed: { include: { room: true } },
      },
    });
  }

  async getRegistrationWithCampById(id: string) {
    return this.prisma.registration.findUnique({
      where: { id },
      include: {
        camp: { select: { id: true } },
        bed: { include: { room: true } },
      },
    });
  }

  async queryRegistrations(campId: string) {
    return this.prisma.registration.findMany({
      where: { campId },
      include: {
        bed: { include: { room: true } },
      },
    });
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
    camp: Camp & { freePlaces: number | Record<string, number> },
    data: Pick<Registration, 'data' | 'locale'>,
    fileField: string | undefined,
  ) {
    const form = formUtils(camp, data.data);

    // TODO Should this really be done here?
    //  Can't we do it at a better place?
    this.validateRegistrationData(form);
    // Get updated data from form back
    const formData = form.data();
    const computedData = this.createComputedData(form.extractCampData());

    const fileConnects: Prisma.FileWhereUniqueInput[] = form
      .getFileIds()
      .map((id) => ({
        id,
        field: fileField,
        registrationId: null,
      }));

    const isWaitingList = async (
      transaction: Prisma.TransactionClient,
    ): Promise<boolean> => {
      // Only participants can be placed on the waiting list
      if (computedData.role && computedData.role !== 'participant') {
        return false;
      }

      // Single max participants for all participants
      if (typeof camp.maxParticipants === 'number') {
        const registrationCount = await transaction.registration.count({
          where: {
            campId: camp.id,
            OR: [{ role: 'participant' }, { role: null }],
          },
        });
        return registrationCount >= camp.maxParticipants;
      }

      // Max participants per country
      // Throw error when country is missing
      if (
        !computedData.country ||
        !(computedData.country in camp.maxParticipants)
      ) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Invalid or missing country data',
        );
      }

      const registrationCount = await transaction.registration.count({
        where: {
          campId: camp.id,
          OR: [{ role: 'participant' }, { role: null }],
          country: computedData.country,
        },
      });

      return registrationCount >= camp.maxParticipants[computedData.country];
    };

    return this.prisma.$transaction(
      async (transaction) => {
        const waitingList = await isWaitingList(transaction);

        return transaction.registration.create({
          data: {
            ...data,
            ...computedData,
            id: undefined, // Force new ID generation
            data: formData,
            waitingList,
            camp: { connect: { id: camp.id } },
            files: { connect: fileConnects },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async updateRegistrationById(
    camp: Camp & { freePlaces: number | Record<string, number> },
    registrationId: string,
    data: Pick<
      Prisma.RegistrationUpdateInput,
      'waitingList' | 'data' | 'customData'
    >,
    fileField: string | undefined,
  ) {
    if (!data.data) {
      return this.prisma.registration.update({
        where: { id: registrationId },
        data: {
          customData: data.customData,
          waitingList: data.waitingList,
        },
        include: {
          bed: { include: { room: true } },
        },
      });
    }

    const form = formUtils(camp);
    form.updateData(data.data);
    const computedData = this.createComputedData(form.extractCampData());

    const fileIds = form.getFileIds();

    return this.prisma.$transaction(async (tx) => {
      // Unreferenced unused files - do not delete
      await tx.file.updateMany({
        where: {
          registrationId,
          id: { notIn: fileIds },
        },
        data: {
          registrationId: null,
          field: null,
        },
      });

      return tx.registration.update({
        where: { id: registrationId },
        data: {
          ...computedData,
          data: data.data,
          customData: data.customData,
          waitingList: data.waitingList,
          files: {
            connect: fileIds.map((id) => ({
              id,
              OR: [
                // Already connected to this registration
                { registrationId },
                // Not connected to any registration yet
                {
                  registrationId: null,
                  field: fileField,
                },
              ],
            })),
          },
        },
        include: {
          bed: { include: { room: true } },
        },
      });
    });
  }

  async deleteRegistration(registration: Registration) {
    await this.prisma.registration.delete({ where: { id: registration.id } });
  }

  async updateRegistrationsComputedDataByCamp(
    camp: Camp & { freePlaces: number | Record<string, number> },
  ) {
    const form = formUtils(camp);
    const registrations = await this.queryRegistrations(camp.id);

    const results = registrations.map((registration) => {
      form.updateData(registration.data);
      const computedData = this.createComputedData(form.extractCampData());

      return this.prisma.registration.update({
        where: { id: registration.id },
        data: {
          ...computedData,
        },
        include: {
          bed: { include: { room: true } },
        },
      });
    });

    await Promise.allSettled(results);
  }

  private createComputedData(
    data: Record<string, unknown[]>,
  ): Partial<Prisma.RegistrationCreateInput> {
    const helper = new RegistrationCampDataHelper(data);

    return {
      firstName: helper.firstName(),
      lastName: helper.lastName(),
      street: helper.street(),
      city: helper.city(),
      zipCode: helper.zipCode(),
      country: helper.country(),
      dateOfBirth: helper.dateOfBirth(),
      emails: helper.emails(),
      role: helper.role(),
      gender: helper.gender(),
    };
  }
}
