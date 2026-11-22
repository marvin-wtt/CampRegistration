import ApiError from '#core/router/ApiError';
import httpStatus from 'http-status';
import { notRetentionPurged } from '#app/event/event.util';
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
} from '#app/registration/registration.helper';
import { registrationColumns } from '#app/registration/registration.columns';
import { isFull } from '#app/registration/registration.capacity';
import { takesPlace } from '@camp-registration/common/form';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service';
import { AuditService } from '#app/audit/audit.service';
import type { RegistrationDeleteReason } from '@camp-registration/common/entities';
import {
  type AuditedRegistration,
  registrationAuditPolicy,
} from '#app/registration/registration.audit';
import type { PrismaTransaction } from '#core/database/transaction';
import { batchesById } from '#core/database/batches';
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
} as const satisfies Prisma.RegistrationSelect;

/** A submission validation accepted, as the controller hands it over. */
export interface NewRegistration extends Pick<
  Registration,
  'locale' | 'group'
> {
  /** Loaded by validation, in the locale and for the group it resolved. */
  form: RegistrationForm;
  /** The form's upload session, whose files the registration takes over. */
  fileField: string;
  /**
   * What the form showed — untrusted, only compared: a submission whose
   * price or consent wording changed meanwhile is refused, never charged or
   * stored differently.
   */
  displayed?: {
    total?: number | undefined;
    consents?: Record<string, string> | undefined;
  };
}

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

  async createRegistration(event: EventWithFreePlaces, input: NewRegistration) {
    const { form, group, displayed = {} } = input;

    const formData = form.data;
    const computedData = registrationColumns(form);
    // Stored whether or not anyone is asked to pay: the form showed it, so it
    // is what this person agreed to, at its group's price.
    const quotedAmount = computeAmountDue(event, form.paymentAmounts(), group);
    assertAmountWithinLimit(quotedAmount);
    assertPriceUnchanged(quotedAmount, displayed.total);

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
    assertConsentTextsUnchanged(consentTexts, displayed.consents);

    const fileIds = form.getFileIds();

    return this.transaction(
      async (transaction) => {
        // Re-read inside the transaction: a deletion that started after this
        // request loaded the event must still stop it.
        await assertNotPurged(transaction, event.id);
        // Staff never wait for a place.
        const waitingList =
          takesPlace(computedData.role) &&
          (await isFull(transaction, event, group));

        const status = waitingList
          ? 'WAITLISTED'
          : event.confirmationMode === 'AUTOMATIC'
            ? 'ACCEPTED'
            : 'PENDING';

        const registration = await transaction.registration.create({
          data: {
            ...computedData,
            locale: input.locale,
            group,
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
            files: this.fileService.getFileConnectInput(
              fileIds,
              input.fileField,
            ),
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
      let formFiles: FileChange | undefined;
      let formData: Record<string, unknown> | undefined;
      let sensitive = false;

      if (data.data) {
        // Read as the form it was answered in: the group's `{event.*}` values
        // and the locale can change what the form shows and computes.
        const form = new RegistrationForm(
          event,
          data.group ?? before.group,
          before.locale,
        );
        // Read before the new response replaces it, to tell what it removed.
        const previousFileIds = form.load(before.data).getFileIds();
        form.load(data.data);
        sensitive = form.sensitiveAnswers().length > 0;
        // Stored as the form leaves it, like a new registration.
        formData = form.data;
        computedData = registrationColumns(form);
        formFiles = { previous: previousFileIds, next: form.getFileIds() };
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

      const files = formFiles
        ? await this.syncFormFiles(tx, registrationId, formFiles, sessionId)
        : undefined;

      const after = await tx.registration
        .update({
          where: {
            id: registrationId,
            // Sensitive answers deleted for good never come back through an
            // edit (docs/privacy.md, 8). Part of the write, so a deletion that
            // started since is caught too.
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
        })
        .catch((error: unknown) => {
          // The registration was read above, so a miss is the purge filter.
          if (
            sensitive &&
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025'
          ) {
            throw new ApiError(
              httpStatus.CONFLICT,
              'Sensitive data of this event is deleted or being deleted, so it cannot be entered again. If the deletion was interrupted, finish it on the Data page first.',
            );
          }
          throw error;
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
        batch.map((registration) =>
          this.prisma.registration.update({
            where: { id: registration.id },
            data: formFor(registration, registrationColumns),
          }),
        ),
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

    for await (const batch of this.registrationBatchesOfEvent(event.id)) {
      for (const { id } of batch) {
        if (await this.clearSensitiveAnswersOf(formFor, id)) {
          cleared++;
        }
      }
    }

    return cleared;
  }

  /**
   * One registration of `clearSensitiveAnswers`, locked while it is read and
   * written, so an edit saved meanwhile is neither overwritten nor lost.
   * Returns whether anything was cleared.
   */
  private async clearSensitiveAnswersOf(
    formFor: ReturnType<typeof registrationForms>,
    registrationId: string,
  ): Promise<boolean> {
    return this.transaction(async (tx) => {
      // Locked before the read below, so that read sees the latest version.
      await tx.$queryRaw`SELECT id FROM registrations WHERE id = ${registrationId} FOR UPDATE`;
      const registration = await tx.registration.findUnique({
        where: { id: registrationId },
        select: BULK_REGISTRATION_SELECT,
      });
      if (!registration) {
        return false;
      }

      const cleared = formFor(registration, (form) => {
        if (form.sensitiveAnswers().length === 0) {
          return null;
        }
        // Columns and files are read off the cleared response, so no copy of
        // an answer stays.
        const previous = form.getFileIds();
        const data = form.withoutSensitiveAnswers();

        return {
          data: { ...registrationColumns(form), data },
          removed: removedFiles({ previous, next: form.getFileIds() }),
        };
      });
      if (!cleared) {
        return false;
      }

      await tx.registration.update({
        where: { id: registrationId },
        data: cleared.data,
      });
      await this.fileService.detachFiles(
        tx,
        'registrationId',
        registrationId,
        cleared.removed,
      );

      return true;
    });
  }

  /** Detaches the uploads a changed response removed and connects its new ones. */
  private async syncFormFiles(
    tx: PrismaTransaction,
    registrationId: string,
    files: FileChange,
    sessionId: string,
  ) {
    await this.fileService.detachFiles(
      tx,
      'registrationId',
      registrationId,
      removedFiles(files),
    );

    return this.fileService.fileConnections(
      'registrationId',
      registrationId,
      files.next,
      sessionId,
    );
  }

  /** The event's registrations, read in batches by id. */
  private registrationBatchesOfEvent(eventId: string) {
    return batchesById(
      (page) =>
        this.prisma.registration.findMany({
          ...page,
          where: { eventId, ...page.where },
          select: BULK_REGISTRATION_SELECT,
        }),
      BATCH_SIZE,
    );
  }

  /**
   * Deletes every registration of the event in one statement, within the
   * caller's transaction if there is one. Bed assignments, files and audit
   * entries are only detached. No mails, no audit entry per registration.
   * Returns how many were deleted.
   */
  async deleteRegistrationsForEvent(eventId: string): Promise<number> {
    const { count } = await this.db.registration.deleteMany({
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

/** The uploads a response's file questions read, before and after a change. */
interface FileChange {
  previous: string[];
  next: string[];
}

/**
 * The uploads a change removed. Only these are detached: one the form doesn't
 * read any more (its question removed since) stays with the response, like its
 * other answers, until the registration is deleted (docs/privacy.md, 8).
 */
function removedFiles({ previous, next }: FileChange): string[] {
  const kept = new Set(next);
  return previous.filter((id) => !kept.has(id));
}
