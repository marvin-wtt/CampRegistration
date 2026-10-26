import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { Prisma, type Registration } from '#generated/prisma/client.js';
import type { EventWithFreePlaces } from '#app/event/event.types';
import { computeAmountDue } from '@camp-registration/common/utils';
import type { PaymentSettlement } from '@camp-registration/common/entities';
import { PaymentService } from '#app/payment/payment.service';
import { getRequestContext } from '#core/context/requestContext';
import { RegistrationForm } from '#app/registration/registration.form';
import { BaseService } from '#core/base/BaseService';
import {
  computedRegistrationData,
  CUSTOM_FILE_FIELD_PREFIX,
  customFileSlots,
} from '#app/registration/registration.helper';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service';
import { AuditService } from '#app/audit/audit.service';
import type { RegistrationDeleteReason } from '@camp-registration/common/entities';
import {
  type AuditedRegistration,
  registrationAuditPolicy,
  registrationIdentity,
} from '#app/registration/registration.audit';
import type { PrismaTransaction } from '#core/database/transaction';
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
    // The ledger summary (`Registration.payment`) is derived on read.
    payments: {
      select: {
        status: true,
        amount: true,
        refunds: { select: { status: true, amount: true } },
      },
    },
    event: { select: { id: true, currency: true } },
  } satisfies Prisma.RegistrationInclude;

  constructor(
    @inject(FileService) private readonly fileService: FileService,
    @inject(PrivacyNoticeService)
    private readonly privacyNoticeService: PrivacyNoticeService,
    @inject(AuditService) private readonly audit: AuditService,
    @inject(PaymentService)
    private readonly paymentService: PaymentService,
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
      include: this.registrationInclude,
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
   * What a submission of `data` would be charged, as `createRegistration`
   * calculates it — the server's own amount, for comparing with what the
   * form displayed.
   */
  quoteAmount(
    event: EventWithFreePlaces,
    data: Pick<Registration, 'data' | 'locale' | 'group'>,
  ): number {
    const form = new RegistrationForm(event, {
      locale: data.locale,
      group: data.group,
    }).load(data.data);

    return computeAmountDue(event, form.paymentAmounts());
  }

  async createRegistration(
    event: EventWithFreePlaces,
    data: Pick<Registration, 'data' | 'locale' | 'group'>,
    fileField: string,
  ) {
    // Built in the locale the data was validated in: event variables such as
    // `{event.price}` resolve per locale, so computed values can differ.
    // Resolved by validation: one of the event's countries, defaulted for a
    // single-group event.
    const { group } = data;

    const form = new RegistrationForm(event, {
      locale: data.locale,
      group,
    }).load(data.data);

    const formData = form.data;
    const eventData = form.extractEventData();
    const computedData = computedRegistrationData(eventData);
    // Stored whether or not payments are collected: the form showed it, so
    // it is what this person agreed to.
    const quotedAmount = computeAmountDue(event, form.paymentAmounts());

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

    // Which privacy information this person was shown, resolved before the
    // transaction: it is a read of published state, and the create runs
    // Serializable.
    const privacyStamp = await this.privacyNoticeService.getStampForEvent(
      event.id,
      event.organizationId,
    );

    return this.transaction(
      async (transaction) => {
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
            amountDue: quotedAmount,
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
          include: this.registrationInclude,
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

      if (data.data) {
        // Read as the form it was answered in: the group's `{event.*}` values
        // and the locale can change what the form shows and computes.
        const form = new RegistrationForm(event, {
          locale: before.locale,
          group: data.group ?? before.group,
        }).load(data.data);
        const eventData = form.extractEventData();
        computedData = computedRegistrationData(eventData);
        formFileIds = form.getFileIds();

        // What is owed is never re-priced by an edit: people owe what the
        // form showed them, unless a manager changes it explicitly.
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
        where: { id: registrationId },
        data: {
          ...computedData,
          data: data.data,
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
    paymentSettlement?: PaymentSettlement,
  ) {
    await this.transaction(async (tx) => {
      // Payments stay, with their payer snapshot; money still held must be
      // settled first, or the deletion is refused.
      const settlement = await this.paymentService.settleForDeletion(
        registration,
        paymentSettlement,
        getRequestContext()?.userId ?? null,
      );

      const deleted = await tx.registration.delete({
        where: { id: registration.id },
      });

      await this.audit.deleted(registrationAuditPolicy, deleted, {
        details: {
          reason,
          ...(settlement && {
            context: {
              ...registrationIdentity(deleted).context,
              paymentSettlement: settlement,
            },
          }),
        },
      });
    });
  }

  async updateRegistrationsComputedDataByEvent(event: EventWithFreePlaces) {
    const registrations = await this.queryRegistrations(event.id);

    // One form per (locale, group) a registration was answered in.
    const forms = new Map<string, RegistrationForm>();
    const formFor = ({ locale, group }: Registration) => {
      const key = `${locale}|${group ?? ''}`;
      let form = forms.get(key);
      if (!form) {
        form = new RegistrationForm(event, { locale, group });
        forms.set(key, form);
      }
      return form;
    };

    const results = registrations.map((registration) => {
      const form = formFor(registration).load(registration.data);
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
