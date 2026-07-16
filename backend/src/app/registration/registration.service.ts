import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { Prisma, type Registration } from '#generated/prisma/client.js';
import { formUtils } from '#utils/form';
import { BaseService } from '#core/base/BaseService';
import {
  CUSTOM_FILE_FIELD_PREFIX,
  RegistrationCampDataHelper,
} from '#app/registration/registration.helper';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service';
import { CampWithFreePlacesAndFiles } from '#app/camp/camp.types';

@injectable()
export class RegistrationService extends BaseService {
  /**
   * `files` is the read model for custom file slots: the slot assignments
   * live solely on the File rows (`field = 'custom:<slot>'`) and are projected
   * into the resource's `files` record on read.
   */
  private readonly registrationInclude = {
    bed: { include: { room: true } },
    files: {
      select: { id: true, field: true },
      where: { field: { startsWith: CUSTOM_FILE_FIELD_PREFIX } },
    },
  } satisfies Prisma.RegistrationInclude;

  constructor(@inject(FileService) private readonly fileService: FileService) {
    super();
  }

  async getRegistrationById(campId: string, id: string) {
    return this.prisma.registration.findFirst({
      where: { id, campId },
      include: this.registrationInclude,
    });
  }

  async getRegistrationsByIds(campId: string, ids: string[]) {
    return this.prisma.registration.findMany({
      where: {
        id: { in: ids },
        campId,
        status: { not: 'PENDING' },
      },
      include: this.registrationInclude,
    });
  }

  async getRegistrationWithCampById(id: string) {
    return this.prisma.registration.findUnique({
      where: { id },
      include: {
        ...this.registrationInclude,
        camp: { select: { id: true } },
      },
    });
  }

  async queryRegistrations(campId: string) {
    return this.prisma.registration.findMany({
      where: { campId },
      include: this.registrationInclude,
    });
  }

  async getOverviewCounts() {
    const total = await this.prisma.registration.count();

    return { total };
  }

  async createRegistration(
    camp: CampWithFreePlacesAndFiles,
    data: Pick<Registration, 'data' | 'locale'>,
    fileField: string,
  ) {
    const form = formUtils(camp, data.data);

    const formData = form.data();
    const computedData = this.createComputedData(form.extractCampData());

    if (camp.countries.length > 1 && !computedData.country) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Country data is required for camps with multiple countries. This is likely due to an invalid registration form',
      );
    }

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

        const status = waitingList
          ? 'WAITLISTED'
          : camp.confirmationMode === 'AUTOMATIC'
            ? 'ACCEPTED'
            : 'PENDING';

        return transaction.registration.create({
          data: {
            ...data,
            ...computedData,
            id: undefined, // Force new ID generation
            data: formData,
            status,
            camp: { connect: { id: camp.id } },
            files: this.fileService.getFileConnectInput(fileIds, fileField),
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async updateRegistrationById(
    camp: CampWithFreePlacesAndFiles,
    registrationId: string,
    data: Pick<
      Prisma.RegistrationUpdateInput,
      'status' | 'data' | 'customData'
    > & {
      customFiles?: Record<string, string | null>;
    },
    sessionId: string,
  ) {
    // Status and custom data are plain field writes; only form data and
    // custom file slots require a transactional file sync.
    if (!data.data && !data.customFiles) {
      return this.prisma.registration.update({
        where: { id: registrationId },
        data: {
          customData: data.customData,
          status: data.status,
        },
        include: this.registrationInclude,
      });
    }

    let computedData: Partial<Prisma.RegistrationCreateInput> = {};
    let formFileIds: string[] | undefined;

    if (data.data) {
      const form = formUtils(camp);
      form.updateData(data.data);
      computedData = this.createComputedData(form.extractCampData());
      formFileIds = form.getFileIds();
    }

    return this.prisma.$transaction(async (tx) => {
      if (data.customFiles) {
        const invalidSlots = await this.fileService.syncFileSlots(
          tx,
          'registrationId',
          registrationId,
          CUSTOM_FILE_FIELD_PREFIX,
          data.customFiles,
          sessionId,
        );

        if (invalidSlots.length > 0) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Invalid file for custom file field(s): ${invalidSlots.join(', ')}`,
          );
        }
      }

      const files = formFileIds
        ? await this.fileService.syncFilesForOwner(
            tx,
            'registrationId',
            registrationId,
            formFileIds,
            sessionId,
            // Custom file slots are managed above and must survive form syncs
            { excludeFieldPrefix: CUSTOM_FILE_FIELD_PREFIX },
          )
        : undefined;

      return tx.registration.update({
        where: { id: registrationId },
        data: {
          ...computedData,
          data: data.data,
          customData: data.customData,
          status: data.status,
          files,
        },
        include: this.registrationInclude,
      });
    });
  }

  async deleteRegistration(registration: Registration) {
    await this.prisma.registration.delete({ where: { id: registration.id } });
  }

  async updateRegistrationsComputedDataByCamp(
    camp: CampWithFreePlacesAndFiles,
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
      newsletterConsent: helper.newsletterConsent() ?? null,
    };
  }
}
