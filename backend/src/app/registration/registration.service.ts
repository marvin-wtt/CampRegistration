import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { type Camp, Prisma, type Registration } from '@prisma/client';
import { formUtils } from '#utils/form';
import { BaseService } from '#core/base/BaseService';
import { RegistrationCampDataHelper } from '#app/registration/registration.helper';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service';

@injectable()
export class RegistrationService extends BaseService {
  constructor(@inject(FileService) private readonly fileService: FileService) {
    super();
  }

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
    fileField: string,
  ) {
    const form = formUtils(camp, data.data);

    // TODO Should this really be done here?
    //  Can't we do it at a better place?
    this.validateRegistrationData(form);
    // Get updated data from form back
    const formData = form.data();
    const computedData = this.createComputedData(form.extractCampData());

    const fileIds = form.getFileIds();

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
            files: this.fileService.getFileConnectInput(fileIds, fileField),
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
    sessionId: string,
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
      const files = await this.fileService.syncFilesForOwner(
        tx,
        'registrationId',
        registrationId,
        fileIds,
        sessionId,
      );

      return tx.registration.update({
        where: { id: registrationId },
        data: {
          ...computedData,
          data: data.data,
          customData: data.customData,
          waitingList: data.waitingList,
          files,
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

    await Promise.all(results);
  }

  private createComputedData(
    data: Record<string, unknown[]>,
  ): Partial<Prisma.RegistrationCreateInput> {
    const helper = new RegistrationCampDataHelper(data);

    return {
      firstName: helper.firstName() ?? null,
      lastName: helper.lastName() ?? null,
      street: helper.street() ?? null,
      city: helper.city() ?? null,
      zipCode: helper.zipCode() ?? null,
      country: helper.country() ?? null,
      dateOfBirth: helper.dateOfBirth() ?? null,
      emails: helper.emails() ?? [],
      role: helper.role() ?? null,
      gender: helper.gender() ?? null,
    };
  }
}
