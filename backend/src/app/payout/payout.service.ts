import type { File, Payout, Prisma } from '#generated/prisma/client';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { ownedWhere } from '#core/permission/ownership';
import httpStatus from 'http-status';
import ApiError from '#core/router/ApiError';
import { AuditService } from '#app/audit/audit.service';
import { FileService } from '#app/file/file.service';
import { FinancePartyService } from '#app/finance/finance-party.service';
import { nextFinanceNumber } from '#app/finance/finance.sequence';
import { payoutAuditPolicy } from '#app/payout/payout.audit';
import {
  freezeStatement,
  isStatementOutdated,
  type StatementExpense,
  type StatementPayout,
} from '#app/payout/payout.statement';
import type { PayoutDirection } from '@camp-registration/common/entities';
import type { PrismaTransaction } from '#core/database/transaction';

export type PayoutWithPrefix = Payout & {
  event: { payoutNumberPrefix: string };
  createdBy: { name: string } | null;
  files: File[];
};

/** As the resource shows it: with the outdated check done. */
export type PayoutView = PayoutWithPrefix & { outdated: boolean };

const include = {
  event: { select: { payoutNumberPrefix: true } },
  createdBy: { select: { name: true } },
  files: { orderBy: { id: 'asc' } },
} as const satisfies Prisma.PayoutInclude;

const statementExpenseSelect = {
  id: true,
  receiptNumber: true,
  type: true,
  amount: true,
  date: true,
  description: true,
  paidByUserId: true,
  paidByName: true,
} as const satisfies Prisma.ExpenseSelect;

const statementPayoutSelect = {
  id: true,
  number: true,
  direction: true,
  amount: true,
  paidOn: true,
  recipientUserId: true,
  recipientName: true,
  createdAt: true,
} as const satisfies Prisma.PayoutSelect;

export interface PayoutCreateInput {
  recipientUserId?: string | null | undefined;
  recipientName?: string | null | undefined;
  direction: PayoutDirection;
  amount: number;
  paidOn?: string | null | undefined;
  note?: string | null | undefined;
}

/** Amount, direction and recipient are frozen in the statement. */
export interface PayoutUpdateInput {
  paidOn?: string | null | undefined;
  note?: string | null | undefined;
  fileIds?: string[] | undefined;
}

@injectable()
export class PayoutService extends BaseService {
  constructor(
    @inject(AuditService) private readonly audit: AuditService,
    @inject(FileService) private readonly fileService: FileService,
    @inject(FinancePartyService)
    private readonly partyService: FinancePartyService,
  ) {
    super();
  }

  async getPayoutById(eventId: string, id: string) {
    return this.prisma.payout.findFirst({ where: { id, eventId }, include });
  }

  /** Not scoped to an event: for the file guard, which starts from a file. */
  async findPayout(id: string) {
    return this.prisma.payout.findUnique({ where: { id }, include });
  }

  /** With `ownerId`, only the payouts that person owns. */
  async queryPayouts(eventId: string, ownerId?: string): Promise<PayoutView[]> {
    const payouts = await this.prisma.payout.findMany({
      where: { eventId, ...(ownerId ? ownedWhere('payout', ownerId) : {}) },
      include,
      orderBy: { number: 'asc' },
    });

    return this.present(eventId, payouts);
  }

  /** Checks each statement against the event's current records. */
  async present(
    eventId: string,
    payouts: PayoutWithPrefix[],
  ): Promise<PayoutView[]> {
    if (payouts.length === 0) {
      return [];
    }
    const ledger = await this.loadLedger(this.prisma, eventId);

    return payouts.map((payout) => ({
      ...payout,
      outdated: isStatementOutdated(payout, ledger.expenses, ledger.payouts),
    }));
  }

  async createPayout(
    eventId: string,
    data: PayoutCreateInput,
    createdByUserId: string,
    locale: string,
  ) {
    return this.transaction(async (tx) => {
      // The counter's row lock comes first: every read after it sees the
      // receipts up to `lastReceiptNumber`, none committed in between.
      const number = await nextFinanceNumber(tx, eventId, 'payout');
      const recipient = await this.resolveRecipient(eventId, data);
      const [event, ledger] = await Promise.all([
        tx.event.findUniqueOrThrow({
          where: { id: eventId },
          select: {
            name: true,
            organizer: true,
            currency: true,
            timezone: true,
            payoutNumberPrefix: true,
            lastReceiptNumber: true,
          },
        }),
        this.loadLedger(tx, eventId),
      ]);

      // Set here so the statement and the record agree on "as of when".
      const createdAt = new Date();
      const statement = freezeStatement(
        {
          id: '',
          number,
          direction: data.direction,
          amount: data.amount,
          paidOn: data.paidOn ?? null,
          recipientUserId: recipient.userId,
          recipientName: recipient.name,
          createdAt,
        },
        ledger.expenses,
        ledger.payouts,
        event.lastReceiptNumber,
        {
          locale,
          currency: event.currency,
          timezone: event.timezone,
          payoutNumberPrefix: event.payoutNumberPrefix,
          eventName: event.name,
          organizer: event.organizer,
        },
      );

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
          statement: statement as unknown as Prisma.InputJsonValue,
          createdByUserId,
          createdAt,
        },
        include,
      });

      await this.audit.created(payoutAuditPolicy, payout);

      // Frozen just now from the same records: current by definition.
      return { ...payout, outdated: false } satisfies PayoutView;
    });
  }

  async updatePayout(
    payout: PayoutWithPrefix,
    data: PayoutUpdateInput,
    sessionId: string,
  ): Promise<PayoutView> {
    return this.transaction(async (tx) => {
      const before = await this.lock(tx, payout);
      // A scan may have further pages; a drawn signature is replaced only by
      // removing it first.
      const added = (data.fileIds ?? []).filter(
        (id) => !before.files.some((f) => f.id === id),
      );
      if (added.length > 0) {
        this.assertSignable({ ...before, files: [] });
      }

      const files = data.fileIds
        ? await this.fileService.syncFilesForOwner(
            tx,
            'payoutId',
            payout.id,
            data.fileIds,
            sessionId,
          )
        : undefined;

      const after = await tx.payout.update({
        where: { id: payout.id },
        data: { paidOn: data.paidOn, note: data.note, files },
        include,
      });

      await this.audit.updated(payoutAuditPolicy, before, after);
      // Further pages of a scan are an update. A scan replaced whole is
      // another signed slip; one removed whole takes the signature back.
      const kept = before.files.filter((f) =>
        after.files.some((a) => a.id === f.id),
      );
      if (added.length > 0 && kept.length === 0) {
        await this.audit.recordFor(payoutAuditPolicy, 'signed', after, {
          details: { values: { scans: after.files.length } },
        });
      } else if (before.files.length > 0 && after.files.length === 0) {
        await this.audit.recordFor(payoutAuditPolicy, 'unsigned', after, {
          details: { values: { scans: before.files.length } },
        });
      }

      // Its own date, note and files aren't on its statement.
      return { ...after, outdated: before.outdated };
    });
  }

  /** The recipient's signature under the statement, as of now. */
  async signPayout(
    payout: PayoutWithPrefix,
    signature: string,
  ): Promise<PayoutView> {
    return this.transaction(async (tx) => {
      const before = await this.lock(tx, payout);
      this.assertSignable(before);

      const signed = await tx.payout.update({
        where: { id: payout.id },
        data: { signature, signedAt: new Date() },
        include,
      });

      await this.audit.recordFor(payoutAuditPolicy, 'signed', signed);

      return { ...signed, outdated: before.outdated };
    });
  }

  /**
   * Takes the signature back, e.g. when the wrong person signed: the drawn
   * one and any scan alike, which is then left for cleanup. Only then can it
   * be signed again.
   */
  async unsignPayout(payout: PayoutWithPrefix): Promise<PayoutView> {
    return this.transaction(async (tx) => {
      const before = await this.lock(tx, payout);
      if (before.signedAt === null && before.files.length === 0) {
        return before;
      }

      // Detached like any removed file: its uploader's session loses it
      // too, so a revoked slip can't be opened or attached elsewhere.
      await tx.file.updateMany({
        where: { payoutId: payout.id },
        data: { payoutId: null, field: null },
      });
      const unsigned = await tx.payout.update({
        where: { id: payout.id },
        data: { signature: null, signedAt: null },
        include,
      });

      await this.audit.recordFor(payoutAuditPolicy, 'unsigned', unsigned, {
        details:
          before.files.length > 0
            ? { values: { scans: before.files.length } }
            : {},
      });

      return { ...unsigned, outdated: before.outdated };
    });
  }

  async deletePayout(payout: PayoutWithPrefix) {
    await this.transaction(async (tx) => {
      await tx.payout.delete({ where: { id: payout.id } });
      await this.audit.deleted(payoutAuditPolicy, payout);
    });
  }

  /**
   * Nobody confirms figures that no longer hold, and a signature is replaced
   * only by removing it first.
   */
  private assertSignable(payout: PayoutView) {
    if (payout.signedAt !== null || payout.files.length > 0) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The payout is already signed; remove the signature first.',
        { code: 'PAYOUT_ALREADY_SIGNED' },
      );
    }
    if (payout.outdated) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The statement is outdated and can no longer be signed.',
        { code: 'PAYOUT_STATEMENT_OUTDATED' },
      );
    }
  }

  /**
   * The payout as it is now, its row locked until the transaction ends: two
   * signatures (or a signature and a scan) can't both pass the check.
   */
  private async lock(
    tx: PrismaTransaction,
    payout: PayoutWithPrefix,
  ): Promise<PayoutView> {
    await tx.$queryRaw`SELECT id FROM payouts WHERE id = ${payout.id} FOR UPDATE`;
    const current = await tx.payout.findUniqueOrThrow({
      where: { id: payout.id },
      include,
    });
    const ledger = await this.loadLedger(tx, payout.eventId);

    return {
      ...current,
      outdated: isStatementOutdated(current, ledger.expenses, ledger.payouts),
    };
  }

  private async loadLedger(
    db: PrismaTransaction,
    eventId: string,
  ): Promise<{ expenses: StatementExpense[]; payouts: StatementPayout[] }> {
    const [expenses, payouts] = await Promise.all([
      db.expense.findMany({
        where: { eventId },
        select: statementExpenseSelect,
      }),
      db.payout.findMany({ where: { eventId }, select: statementPayoutSelect }),
    ]);

    return { expenses, payouts };
  }

  /** A payout always goes to someone; event funds are the other side. */
  private async resolveRecipient(eventId: string, data: PayoutCreateInput) {
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
