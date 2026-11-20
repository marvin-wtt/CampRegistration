import ApiError from '#core/router/ApiError';
import httpStatus from 'http-status';
import { isRetentionPurged, notRetentionPurged } from '#app/event/event.util';
import { Prisma, type Registration } from '#generated/prisma/client.js';
import type { EventWithFreePlaces } from '#app/event/event.types';
import { computeAmountDue } from '@camp-registration/common/utils';
import {
  assertAmountWithinLimit,
  assertPriceUnchanged,
} from './registration.price-check.js';
import {
  RegistrationForm,
  registrationForms,
} from '#app/registration/registration.form';
import { BaseService } from '#core/base/BaseService';
import {
  CUSTOM_FILE_FIELD_PREFIX,
  customFileSlots,
  registrationColumns,
} from '#app/registration/registration.helper';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service';
import { AuditService } from '#app/audit/audit.service';
import type { RegistrationDeleteReason } from '@camp-registration/common/entities';
import {
  type AuditedRegistration,
  registrationAuditPolicy,
} from '#app/registration/registration.audit';
import type { PrismaTransaction } from '#core/database/transaction';
import { PrivacyNoticeService } from '#app/privacyNotice/privacy-notice.service';
import {
  assertConsentsGiven,
  assertConsentTextsUnchanged,
} from './registration.privacy.js';

/** Registrations read per round trip by the bulk operations. */
const BATCH_SIZE = 100;

/** What the bulk operations read of a registration. */
const BULK_REGISTRATION_SELECT = {
  id: true,
  data: true,
  locale: true,
  group: true,
  updatedAt: true,
} as const satisfies Prisma.RegistrationSelect;

type BulkRegistration = Prisma.RegistrationGetPayload<{
  select: typeof BULK_REGISTRATION_SELECT;
}>;

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
    @inject(AuditService) private readonly audit: AuditService,
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

  /**
   * `displayedTotal` is what the form showed: a submission whose price changed
   * meanwhile is refused (`assertPriceUnchanged`), never charged differently.
   * `displayedConsents` does the same for the consent wording.
   */
  async createRegistration(
    event: EventWithFreePlaces,
    data: Pick<Registration, 'data' | 'locale' | 'group'>,
    fileField: string,
    displayedTotal?: number,
    displayedConsents?: Record<string, string>,
  ) {
    // Also for managers, who may register outside the window: deleted data
    // is never restored (docs/privacy.md, 8).
    if (isRetentionPurged(event)) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Registration data of this event was deleted; it takes no registrations.',
      );
    }

    // Built in the locale the data was validated in: event variables such as
    // `{event.price}` resolve per locale, so computed values can differ.
    // Resolved by validation: one of the event's countries, defaulted for a
    // single-group event.
    const { group } = data;

    const form = new RegistrationForm(event, group, data.locale).load(
      data.data,
    );

    const formData = form.data;
    const computedData = registrationColumns(form);
    // Stored whether or not anyone is asked to pay: the form showed it, so it
    // is what this person agreed to, at its group's price.
    const quotedAmount = computeAmountDue(event, form.paymentAmounts(), group);
    assertAmountWithinLimit(quotedAmount);
    assertPriceUnchanged(quotedAmount, displayedTotal);

    // Which privacy information this person was shown, resolved before the
    // transaction: it is a read of published state, and the create runs
    // Serializable. Sensitive answers need the consent they rest on
    // (docs/privacy.md, 5), checked against that same notice.
    const { stamp: privacyStamp, notice } =
      await this.privacyNoticeService.getNoticeForRegistration(
        event.id,
        event.organizationId,
      );
    assertConsentsGiven(form, notice);
    const consentTexts = form.givenConsentTexts();
    assertConsentTextsUnchanged(consentTexts, displayedConsents);

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

      // Max participants per group
      // Throw error when group is missing
      if (!group || !(group in event.maxParticipants)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or missing group');
      }

      const registrationCount = await transaction.registration.count({
        where: {
          eventId: event.id,
          OR: [{ role: 'participant' }, { role: null }],
          group,
        },
      });

      return registrationCount >= event.maxParticipants[group];
    };

    return this.transaction(
      async (transaction) => {
        // Re-read inside the transaction: a deletion that started after this
        // request loaded the event must still stop it.
        await assertNotPurged(transaction, event.id);
        const waitingList = await isWaitingList(transaction);

        const status = waitingList
          ? 'WAITLISTED'
          : event.confirmationMode === 'AUTOMATIC'
            ? 'ACCEPTED'
            : 'PENDING';

        const registration = await transaction.registration.create({
          data: {
            ...data,
            ...computedData,
            group,
            id: undefined, // Force new ID generation
            data: formData,
            status,
            quotedAmount,
            currency: event.currency,
            consentTexts:
              Object.keys(consentTexts).length > 0 ? consentTexts : undefined,
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

        // A registration is created by an external party via the public
        // form — always system-attributed, never the logged-in manager who
        // may happen to share the session.
        await this.audit.created(registrationAuditPolicy, registration, {
          actorId: null,
        });

        return registration;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async updateRegistrationById(
    event: EventWithFreePlaces,
    registrationId: string,
    data: Pick<
      Prisma.RegistrationUpdateInput,
      'status' | 'data' | 'customData'
    > & {
      group?: string;
      customFiles?: Record<string, string | null>;
    },
    sessionId: string,
  ) {
    // Status, group and custom data are plain field writes; only form data and
    // custom file slots require a transactional file sync.
    if (!data.data && !data.customFiles) {
      return this.transaction(async (tx) => {
        const before = await tx.registration.findUniqueOrThrow({
          where: { id: registrationId },
        });

        const after = await tx.registration.update({
          where: { id: registrationId },
          data: {
            customData: data.customData,
            status: data.status,
            group: data.group,
          },
          include: this.registrationInclude,
        });

        await this.audit.updated(registrationAuditPolicy, before, after);

        return after;
      });
    }

    return this.transaction(async (tx) => {
      const before: AuditedRegistration =
        await tx.registration.findUniqueOrThrow({
          where: { id: registrationId },
        });

      let computedData: Partial<Prisma.RegistrationCreateInput> = {};
      let formFileIds: string[] | undefined;
      let formData: Record<string, unknown> | undefined;
      let sensitive = false;

      if (data.data) {
        // Read as the form it was answered in: the group's `{event.*}` values
        // and the locale can change what the form shows and computes.
        const form = new RegistrationForm(
          event,
          data.group ?? before.group,
          before.locale,
        ).load(data.data);
        sensitive = form.sensitiveAnswers().length > 0;
        // Stored as the form leaves it, like a new registration.
        formData = form.data;
        computedData = registrationColumns(form);
        formFileIds = form.getFileIds();
      }
      if (data.customFiles) {
        before.customFiles = await this.customFileSlots(tx, registrationId);
      }

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

      const after = await tx.registration.update({
        where: {
          id: registrationId,
          // Sensitive answers deleted for good never come back through an edit
          // (docs/privacy.md, 8). Part of the write, so a deletion that started
          // since is caught too.
          ...(sensitive ? { event: notRetentionPurged } : {}),
        },
        data: {
          ...computedData,
          data: formData,
          customData: data.customData,
          status: data.status,
          group: data.group,
          files,
        },
        include: this.registrationInclude,
      });

      await this.audit.updated(
        registrationAuditPolicy,
        before,
        data.customFiles
          ? {
              ...after,
              customFiles: { ...before.customFiles, ...data.customFiles },
            }
          : after,
      );

      return after;
    });
  }

  private async customFileSlots(
    tx: PrismaTransaction,
    registrationId: string,
  ): Promise<Record<string, string>> {
    const files = await tx.file.findMany({
      where: {
        registrationId,
        field: { startsWith: CUSTOM_FILE_FIELD_PREFIX },
      },
      select: { id: true, field: true },
    });

    return customFileSlots(files);
  }

  async getNamesByIds(
    eventId: string,
    ids: string[],
  ): Promise<Map<string, string>> {
    const registrations = await this.prisma.registration.findMany({
      where: { eventId, id: { in: ids } },
      select: { id: true, firstName: true, lastName: true },
    });

    return new Map(
      registrations.map(({ id, firstName, lastName }) => [
        id,
        [firstName, lastName].filter(Boolean).join(' '),
      ]),
    );
  }

  async deleteRegistration(
    registration: Registration,
    reason?: RegistrationDeleteReason,
  ) {
    await this.transaction(async (tx) => {
      const deleted = await tx.registration.delete({
        where: { id: registration.id },
      });

      await this.audit.deleted(registrationAuditPolicy, deleted, {
        details: { reason },
      });
    });
  }

  async updateRegistrationsComputedDataByEvent(event: EventWithFreePlaces) {
    const formFor = registrationForms(event);

    // A batch at a time: in parallel within one, bounded in memory overall.
    for await (const batch of this.registrationBatchesOfEvent(event.id)) {
      await Promise.all(
        batch.map((registration) => {
          const form = formFor(registration).load(registration.data);

          return this.prisma.registration.update({
            where: { id: registration.id },
            data: registrationColumns(form),
          });
        }),
      );
    }
  }

  /**
   * Clears the answers to special-category questions in every registration of
   * the event and detaches the files uploaded to them; the file cleanup removes
   * those. No mails, no audit entry per registration. Returns how many changed.
   */
  async clearSensitiveAnswers(event: EventWithFreePlaces): Promise<number> {
    const formFor = registrationForms(event);
    let cleared = 0;

    for await (const registration of this.registrationsOfEvent(event.id)) {
      if (await this.clearSensitiveAnswersOf(formFor, registration)) {
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * One registration of `clearSensitiveAnswers`. Written only over the version
   * read, so an edit saved meanwhile is never overwritten: the row is read
   * again and cleared anew. Returns whether anything was cleared.
   */
  private async clearSensitiveAnswersOf(
    formFor: ReturnType<typeof registrationForms>,
    registration: BulkRegistration,
    attempts = 3,
  ): Promise<boolean> {
    const form = formFor(registration).load(registration.data);
    if (form.sensitiveAnswers().length === 0) {
      return false;
    }

    // From here on the form holds the cleared response: the computed columns
    // and files are read from it, so no copy of an answer stays. Computed
    // before the transaction, which then only writes.
    const data = form.withoutSensitiveAnswers();
    const fileIds = form.getFileIds();
    const computedData = registrationColumns(form);

    const written = await this.transaction(async (tx) => {
      const { count } = await tx.registration.updateMany({
        where: { id: registration.id, updatedAt: registration.updatedAt },
        data: { ...computedData, data },
      });
      if (count === 0) {
        return false;
      }

      await this.fileService.detachFilesExcept(
        tx,
        'registrationId',
        registration.id,
        fileIds,
        { excludeFieldPrefix: CUSTOM_FILE_FIELD_PREFIX },
      );
      return true;
    });
    if (written) {
      return true;
    }

    if (attempts <= 1) {
      // The deletion is idempotent: running it again finishes the job.
      throw new ApiError(
        httpStatus.CONFLICT,
        'A registration kept changing during the deletion. Please run it again.',
      );
    }
    const current = await this.prisma.registration.findUnique({
      where: { id: registration.id },
      select: BULK_REGISTRATION_SELECT,
    });

    return current
      ? this.clearSensitiveAnswersOf(formFor, current, attempts - 1)
      : false;
  }

  /** The event's registrations, read in batches by id. */
  private async *registrationBatchesOfEvent(eventId: string) {
    let cursor: string | undefined;
    let batch;

    do {
      batch = await this.prisma.registration.findMany({
        where: { eventId },
        select: BULK_REGISTRATION_SELECT,
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });
      if (batch.length > 0) {
        yield batch;
      }
      cursor = batch.at(-1)?.id;
    } while (batch.length === BATCH_SIZE);
  }

  /** The event's registrations one by one, read in batches. */
  private async *registrationsOfEvent(eventId: string) {
    for await (const batch of this.registrationBatchesOfEvent(eventId)) {
      yield* batch;
    }
  }

  /**
   * Deletes every registration of the event in one statement. Bed assignments,
   * files and audit entries are only detached. No mails, no audit entry per
   * registration. Returns how many were deleted.
   */
  async deleteRegistrationsForEvent(eventId: string): Promise<number> {
    const { count } = await this.prisma.registration.deleteMany({
      where: { eventId },
    });

    return count;
  }
}

/** Deleted data is never restored (docs/privacy.md, 8). */
async function assertNotPurged(
  tx: PrismaTransaction,
  eventId: string,
): Promise<void> {
  const open = await tx.event.count({
    where: { id: eventId, ...notRetentionPurged },
  });
  if (open === 0) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'Registration data of this event was deleted; it takes no registrations.',
    );
  }
}
