import { inject, injectable } from 'inversify';
import { AuditService } from '#app/audit/audit.service';
import httpStatus from 'http-status';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#core/router/ApiError';
import {
  computeBalances,
  computeCategoryTotals,
} from '#app/finance/finance.balances';
import type {
  EventManagerRole,
  FinanceBalance,
  FinanceParties,
  FinanceSettings,
  FinanceSummary,
} from '@camp-registration/common/entities';

@injectable()
export class FinanceService extends BaseService {
  constructor(@inject(AuditService) private readonly audit: AuditService) {
    super();
  }

  /** With `userId`, only that person's balance (possibly none). */
  async getBalances(
    eventId: string,
    userId?: string,
  ): Promise<FinanceBalance[]> {
    const { expenses, payouts } = await this.loadLedger(eventId);
    const balances = computeBalances(expenses, payouts);

    return userId ? balances.filter((b) => b.userId === userId) : balances;
  }

  async getSummary(eventId: string, currency: string): Promise<FinanceSummary> {
    const { expenses, payouts } = await this.loadLedger(eventId);
    const balances = computeBalances(expenses, payouts);

    const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
    const spent = expenses.filter((e) => e.type === 'EXPENSE');
    const refunded = expenses.filter((e) => e.type === 'REFUND');
    const byPerson = (e: (typeof expenses)[number]) =>
      e.paidByUserId !== null || e.paidByName !== null;

    return {
      currency,
      expenses: sum(spent.map((e) => e.amount)),
      refunds: sum(refunded.map((e) => e.amount)),
      total:
        sum(spent.map((e) => e.amount)) - sum(refunded.map((e) => e.amount)),
      owedToPeople: sum(balances.map((b) => Math.max(b.balance, 0))),
      owedToEvent: sum(balances.map((b) => Math.max(-b.balance, 0))),
      toTransfer: sum(balances.map((b) => b.toPay)),
      paidByPeople: sum(spent.filter(byPerson).map((e) => e.amount)),
      paidByFunds: sum(spent.filter((e) => !byPerson(e)).map((e) => e.amount)),
      receiptCount: expenses.length,
      receiptsWithoutFile: expenses
        .filter((e) => e._count.files === 0)
        .map((e) => e.receiptNumber),
      receiptsPending: expenses
        .filter((e) => e.date === null)
        .map((e) => e.receiptNumber),
      byCategory: computeCategoryTotals(expenses),
    };
  }

  async getSettings(eventId: string): Promise<FinanceSettings> {
    const [event, payoutCount] = await Promise.all([
      this.prisma.event.findUniqueOrThrow({
        where: { id: eventId },
        select: { payoutNumberPrefix: true, lastPayoutNumber: true },
      }),
      this.prisma.payout.count({ where: { eventId } }),
    ]);

    return {
      payoutNumberPrefix: event.payoutNumberPrefix,
      // A deleted payout's slip may still be in someone's folder.
      payoutNumberPrefixLocked: payoutCount > 0 || event.lastPayoutNumber > 0,
    };
  }

  async updateSettings(
    eventId: string,
    data: { payoutNumberPrefix?: string | undefined },
  ): Promise<FinanceSettings> {
    const settings = await this.getSettings(eventId);

    if (
      data.payoutNumberPrefix !== undefined &&
      data.payoutNumberPrefix !== settings.payoutNumberPrefix
    ) {
      if (settings.payoutNumberPrefixLocked) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'The payout prefix is fixed once a payout exists.',
          { code: 'PAYOUT_PREFIX_LOCKED' },
        );
      }

      const prefix = data.payoutNumberPrefix;
      await this.transaction(async (tx) => {
        // Raw, like the number counters: a finance setting isn't an event
        // edit and must not bump its `updatedAt`.
        await tx.$executeRaw`UPDATE events SET payout_number_prefix = ${prefix} WHERE id = ${eventId}`;
        await this.audit.record({
          action: 'updated',
          entityType: 'event',
          entityId: eventId,
          eventId,
          details: {
            changedFields: ['payoutNumberPrefix'],
            values: { payoutNumberPrefix: prefix },
          },
        });
      });
    }

    return this.getSettings(eventId);
  }

  /**
   * Current managers with an account, and the names typed before — suggested
   * so balances, which group by exact name, don't split on a typo.
   */
  async getParties(
    eventId: string,
    selfUserId: string,
  ): Promise<FinanceParties> {
    const [managers, expenses, payouts] = await Promise.all([
      this.prisma.eventManager.findMany({
        where: {
          eventId,
          user: { isNot: null },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { role: true, user: { select: { id: true, name: true } } },
      }),
      this.prisma.expense.findMany({
        where: { eventId, paidByUserId: null, paidByName: { not: null } },
        select: { paidByName: true },
        distinct: ['paidByName'],
      }),
      this.prisma.payout.findMany({
        where: { eventId, recipientUserId: null },
        select: { recipientName: true },
        distinct: ['recipientName'],
      }),
    ]);

    const names = new Set([
      ...expenses.flatMap((e) => (e.paidByName ? [e.paidByName] : [])),
      ...payouts.map((p) => p.recipientName),
    ]);

    return {
      managers: managers
        .flatMap((m) =>
          m.user
            ? [
                {
                  userId: m.user.id,
                  name: m.user.name,
                  role: m.role as EventManagerRole,
                },
              ]
            : [],
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
      names: [...names].sort((a, b) => a.localeCompare(b)),
      selfUserId,
    };
  }

  /** Everything the export and the receipt ZIP are built from. */
  async getExportData(eventId: string) {
    const [event, expenses, payouts, categories] = await Promise.all([
      this.prisma.event.findUniqueOrThrow({
        where: { id: eventId },
        select: { currency: true, payoutNumberPrefix: true },
      }),
      this.prisma.expense.findMany({
        where: { eventId },
        include: { files: { orderBy: { id: 'asc' } } },
        orderBy: { receiptNumber: 'asc' },
      }),
      this.prisma.payout.findMany({
        where: { eventId },
        orderBy: { number: 'asc' },
      }),
      this.prisma.expenseCategory.findMany({ where: { eventId } }),
    ]);

    return {
      currency: event.currency,
      payoutNumberPrefix: event.payoutNumberPrefix,
      expenses,
      payouts,
      categories,
    };
  }

  private async loadLedger(eventId: string) {
    const [expenses, payouts] = await Promise.all([
      this.prisma.expense.findMany({
        where: { eventId },
        select: {
          receiptNumber: true,
          date: true,
          type: true,
          amount: true,
          categoryId: true,
          paidByUserId: true,
          paidByName: true,
          _count: { select: { files: true } },
        },
        orderBy: { receiptNumber: 'asc' },
      }),
      this.prisma.payout.findMany({
        where: { eventId },
        select: {
          direction: true,
          amount: true,
          paidOn: true,
          recipientUserId: true,
          recipientName: true,
        },
        orderBy: { number: 'asc' },
      }),
    ]);

    return { expenses, payouts };
  }
}
