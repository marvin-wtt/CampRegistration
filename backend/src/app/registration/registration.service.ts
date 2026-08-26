import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import {
  type Event,
  Prisma,
  type Registration,
} from '#generated/prisma/client.js';
import { formUtils } from '#utils/form';
import { BaseService } from '#core/base/BaseService';
import {
  computedRegistrationData,
  CUSTOM_FILE_FIELD_PREFIX,
} from '#app/registration/registration.helper';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service';
import { PrivacyNoticeService } from '#app/privacyNotice/privacy-notice.service';

/** The create uses relation connects throughout, so the stamp must too. */
function connectVersion(id: string | null) {
  return id ? { connect: { id } } : undefined;
}
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

  constructor(
    @inject(FileService) private readonly fileService: FileService,
    @inject(PrivacyNoticeService)
    private readonly privacyNoticeService: PrivacyNoticeService,
  ) {
    super();
  }

  async getRegistrationById(eventId: string, id: string) {
    return this.prisma.registration.findFirst({
      where: { id, eventId },
      include: this.registrationInclude,
    });
  }

  async getRegistrationsByIds(eventId: string, ids: string[]) {
    return this.prisma.registration.findMany({
      where: {
        id: { in: ids },
        eventId,
        status: { not: 'PENDING' },
      },
      include: this.registrationInclude,
    });
  }

  async getRegistrationWithEventById(id: string) {
    return this.prisma.registration.findUnique({
      where: { id },
      include: {
        ...this.registrationInclude,
        event: { select: { id: true } },
      },
    });
  }

  async queryRegistrations(eventId: string) {
    return this.prisma.registration.findMany({
      where: { eventId },
      include: this.registrationInclude,
    });
  }

  async getOverviewCounts() {
    const total = await this.prisma.registration.count();

    return { total };
  }

  async createRegistration(
    event: Event & { freePlaces: number | Record<string, number> },
    data: Pick<Registration, 'data' | 'locale'>,
    fileField: string,
  ) {
    const form = formUtils(event, data.data);

    const formData = form.data();
    const computedData = computedRegistrationData(form.extractEventData());

    if (event.countries.length > 1 && !computedData.country) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Country data is required for events with multiple countries. This is likely due to an invalid registration form',
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
      if (typeof event.maxParticipants === 'number') {
        const registrationCount = await transaction.registration.count({
          where: {
            eventId: event.id,
            OR: [{ role: 'participant' }, { role: null }],
          },
        });
        return registrationCount >= event.maxParticipants;
      }

      // Max participants per country
      // Throw error when country is missing
      if (
        !computedData.country ||
        !(computedData.country in event.maxParticipants)
      ) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Invalid or missing country data',
        );
      }

      const registrationCount = await transaction.registration.count({
        where: {
          eventId: event.id,
          OR: [{ role: 'participant' }, { role: null }],
          country: computedData.country,
        },
      });

      return registrationCount >= event.maxParticipants[computedData.country];
    };

    // Which privacy information this person was shown, resolved before the
    // transaction: it is a read of published state, and the create runs
    // Serializable.
    const privacyStamp = await this.privacyNoticeService.getStampForEvent(
      event.id,
      event.organizationId,
    );

    return this.prisma.$transaction(
      async (transaction) => {
        const waitingList = await isWaitingList(transaction);

        const status = waitingList
          ? 'WAITLISTED'
          : event.confirmationMode === 'AUTOMATIC'
            ? 'ACCEPTED'
            : 'PENDING';

        return transaction.registration.create({
          data: {
            ...data,
            ...computedData,
            id: undefined, // Force new ID generation
            data: formData,
            status,
            platformPrivacyPolicyUpdatedAt:
              privacyStamp.platformPrivacyPolicyUpdatedAt,
            organizationPrivacyNotice: connectVersion(
              privacyStamp.organizationPrivacyNoticeVersionId,
            ),
            eventPrivacyNotice: connectVersion(
              privacyStamp.eventPrivacyNoticeVersionId,
            ),
            event: { connect: { id: event.id } },
            files: this.fileService.getFileConnectInput(fileIds, fileField),
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async updateRegistrationById(
    event: Event & { freePlaces: number | Record<string, number> },
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
      const form = formUtils(event);
      form.updateData(data.data);
      computedData = computedRegistrationData(form.extractEventData());
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

  async updateRegistrationsComputedDataByEvent(
    event: Event & { freePlaces: number | Record<string, number> },
  ) {
    const form = formUtils(event);
    const registrations = await this.queryRegistrations(event.id);

    const results = registrations.map((registration) => {
      form.updateData(registration.data);
      const computedData = computedRegistrationData(form.extractEventData());

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
}
