import type { Payout, Prisma } from '#generated/prisma/client';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { ownedWhere } from '#core/permission/ownership';
import httpStatus from 'http-status';
import ApiError from '#core/router/ApiError';
import { AuditService } from '#app/audit/audit.service';
import { FinancePartyService } from '#app/finance/finance-party.service';
import { nextFinanceNumber } from '#app/finance/finance.sequence';
import { payoutAuditPolicy } from '#app/payout/payout.audit';
import type { PayoutDirection } from '@camp-registration/common/entities';

export type PayoutWithPrefix = Payout & {
  event: { payoutNumberPrefix: string };
  createdBy: { name: string } | null;
};

const include = {
  event: { select: { payoutNumberPrefix: true } },
  createdBy: { select: { name: true } },
} as const satisfies Prisma.PayoutInclude;

export interface PayoutWriteData {
  recipientUserId?: string | null | undefined;
  recipientName?: string | null | undefined;
  direction?: PayoutDirection | undefined;
  amount?: number | undefined;
  paidOn?: string | null | undefined;
  note?: string | null | undefined;
}

@injectable()
export class PayoutService extends BaseService {
  constructor(
    @inject(AuditService) private readonly audit: AuditService,
    @inject(FinancePartyService)
    private readonly partyService: FinancePartyService,
  ) {
    super();
  }

  async getPayoutById(eventId: string, id: string) {
    return this.prisma.payout.findFirst({ where: { id, eventId }, include });
  }

  /** With `ownerId`, only the payouts that person owns. */
  async queryPayouts(eventId: string, ownerId?: string) {
    return this.prisma.payout.findMany({
      where: { eventId, ...(ownerId ? ownedWhere('payout', ownerId) : {}) },
      include,
      orderBy: { number: 'asc' },
    });
  }

  async createPayout(
    eventId: string,
    data: PayoutWriteData & {
      direction: PayoutDirection;
      amount: number;
    },
    createdByUserId: string,
  ) {
    return this.transaction(async (tx) => {
      const recipient = await this.resolveRecipient(eventId, data);
      const number = await nextFinanceNumber(tx, eventId, 'payout');

      const payout = await tx.payout.create({
        data: {
          eventId,
          number,
          recipientUserId: recipient.userId,
          recipientName: recipient.name,
          direction: data.direction,
          amount: data.amount,
          paidOn: data.paidOn ?? null,
          note: data.note ?? null,
          createdByUserId,
        },
        include,
      });

      await this.audit.created(payoutAuditPolicy, payout);

      return payout;
    });
  }

  async updatePayout(payout: PayoutWithPrefix, data: PayoutWriteData) {
    return this.transaction(async (tx) => {
      const recipientChanged =
        data.recipientUserId !== undefined || data.recipientName !== undefined;
      const recipient = recipientChanged
        ? await this.resolveChangedRecipient(payout, data)
        : undefined;

      // A signature covers what was signed: another amount, direction or
      // person needs signing again.
      const resign =
        (data.amount !== undefined && data.amount !== payout.amount) ||
        (data.direction !== undefined && data.direction !== payout.direction) ||
        (recipient !== undefined &&
          (recipient.userId !== payout.recipientUserId ||
            recipient.name !== payout.recipientName));

      const after = await tx.payout.update({
        where: { id: payout.id },
        data: {
          recipientUserId: recipient?.userId,
          recipientName: recipient?.name,
          direction: data.direction,
          amount: data.amount,
          paidOn: data.paidOn,
          note: data.note,
          ...(resign ? { signature: null, signedAt: null } : {}),
        },
        include,
      });

      await this.audit.updated(payoutAuditPolicy, payout, after);

      return after;
    });
  }

  /** The recipient's signature under the statement, as of now. */
  async signPayout(payout: PayoutWithPrefix, signature: string) {
    return this.transaction(async (tx) => {
      const signed = await tx.payout.update({
        where: { id: payout.id },
        data: { signature, signedAt: new Date() },
        include,
      });

      await this.audit.recordFor(payoutAuditPolicy, 'signed', signed);

      return signed;
    });
  }

  /** Takes the signature back, e.g. when the wrong person signed. */
  async unsignPayout(payout: PayoutWithPrefix) {
    if (payout.signedAt === null) {
      return payout;
    }

    return this.transaction(async (tx) => {
      const unsigned = await tx.payout.update({
        where: { id: payout.id },
        data: { signature: null, signedAt: null },
        include,
      });

      await this.audit.recordFor(payoutAuditPolicy, 'unsigned', unsigned);

      return unsigned;
    });
  }

  async deletePayout(payout: PayoutWithPrefix) {
    await this.transaction(async (tx) => {
      await tx.payout.delete({ where: { id: payout.id } });
      await this.audit.deleted(payoutAuditPolicy, payout);
    });
  }

  private async resolveChangedRecipient(payout: Payout, data: PayoutWriteData) {
    const userId =
      data.recipientUserId !== undefined
        ? data.recipientUserId
        : payout.recipientUserId;
    if (userId && userId === payout.recipientUserId) {
      return { userId, name: payout.recipientName };
    }

    return this.resolveRecipient(payout.eventId, {
      recipientUserId: userId,
      recipientName: data.recipientName,
    });
  }

  /** A payout always goes to someone; event funds are the other side. */
  private async resolveRecipient(eventId: string, data: PayoutWriteData) {
    const party = await this.partyService.resolveParty(eventId, {
      userId: data.recipientUserId,
      name: data.recipientName,
    });

    if (!party.name) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'A payout needs a recipient.',
        {
          code: 'PAYOUT_RECIPIENT_REQUIRED',
        },
      );
    }

    return { userId: party.userId, name: party.name };
  }
}
