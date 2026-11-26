import { inject, injectable } from 'inversify';
import { AuditService } from '#app/audit/audit.service';
import { FinancePartyService } from '#app/finance/finance-party.service';
import httpStatus from 'http-status';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#core/router/ApiError';
import {
  computeBalances,
  computeCategoryTotals,
  summarizeFees,
  summarizeIncome,
  summaryResults,
} from '#app/finance/finance.balances';
import type {
  FinanceBalance,
  FinanceParties,
  FinanceSettings,
  FinanceSettingsUpdateData,
  FinanceSummary,
} from '@camp-registration/common/entities';

@injectable()
export class FinanceService extends BaseService {
  constructor(
    @inject(AuditService) private readonly audit: AuditService,
    @inject(FinancePartyService)
    private readonly partyService: FinancePartyService,
  ) {
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
    const { incomes, fees } = await this.loadIncome(eventId, currency);

    const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
    const spent = expenses.filter((e) => e.type === 'EXPENSE');
    const refunded = expenses.filter((e) => e.type === 'REFUND');
    const paid = spent.filter((e) => e.paidOn !== null);
    const unpaid = expenses.filter((e) => e.paidOn === null);
    const byPerson = (e: (typeof expenses)[number]) =>
      e.paidByUserId !== null || e.paidByName !== null;
    const signed = (e: (typeof expenses)[number]) =>
      e.type === 'REFUND' ? -e.amount : e.amount;
    // Invoices still to pay count all the same: the event will pay them.
    const total =
      sum(spent.map((e) => e.amount)) - sum(refunded.map((e) => e.amount));
    const income = summarizeIncome(incomes);

    return {
      currency,
      expenses: sum(spent.map((e) => e.amount)),
      refunds: sum(refunded.map((e) => e.amount)),
      total,
      unpaid: sum(unpaid.map(signed)),
      owedToPeople: sum(balances.map((b) => Math.max(b.balance, 0))),
      owedToEvent: sum(balances.map((b) => Math.max(-b.balance, 0))),
      toTransfer: sum(balances.map((b) => b.toPay)),
      paidByPeople: sum(paid.filter(byPerson).map((e) => e.amount)),
      paidByFunds: sum(paid.filter((e) => !byPerson(e)).map((e) => e.amount)),
      receiptCount: expenses.length,
      receiptsWithoutFile: expenses
        .filter((e) => e._count.files === 0)
        .map((e) => e.receiptNumber),
      receiptsPending: expenses
        .filter((e) => e.date === null)
        .map((e) => e.receiptNumber),
      receiptsUnpaid: unpaid.map((e) => e.receiptNumber),
      byCategory: computeCategoryTotals(expenses),
      ...income,
      ...fees,
      ...summaryResults({ ...income, ...fees, total }),
    };
  }

  async getSettings(eventId: string): Promise<FinanceSettings> {
    const finance = await this.prisma.eventFinance.findUniqueOrThrow({
      where: { eventId },
      select: {
        payoutNumberPrefix: true,
        lastPayoutNumber: true,
        incomeNumberPrefix: true,
        lastIncomeNumber: true,
      },
    });

    return {
      payoutNumberPrefix: finance.payoutNumberPrefix,
      // The counters count deleted records too, whose numbers may still be
      // on paper in someone's folder.
      payoutNumberPrefixLocked: finance.lastPayoutNumber > 0,
      incomeNumberPrefix: finance.incomeNumberPrefix,
      incomeNumberPrefixLocked: finance.lastIncomeNumber > 0,
    };
  }

  async updateSettings(
    eventId: string,
    data: FinanceSettingsUpdateData,
  ): Promise<FinanceSettings> {
    const settings = await this.getSettings(eventId);

    for (const sequence of ['payout', 'income'] as const) {
      const { field, counter, code } = PREFIXES[sequence];
      const prefix = data[field];
      if (prefix === undefined || prefix === settings[field]) {
        continue;
      }

      await this.transaction(async (tx) => {
        // Conditional on the counter, so a record created meanwhile can't
        // end up with the old prefix.
        const { count } =
          counter === 'lastPayoutNumber'
            ? await tx.eventFinance.updateMany({
                where: { eventId, lastPayoutNumber: 0 },
                data: { payoutNumberPrefix: prefix },
              })
            : await tx.eventFinance.updateMany({
                where: { eventId, lastIncomeNumber: 0 },
                data: { incomeNumberPrefix: prefix },
              });
        if (count === 0) {
          throw new ApiError(
            httpStatus.CONFLICT,
            `The ${sequence} prefix is fixed once a ${sequence} exists.`,
            { code },
          );
        }

        await this.audit.record({
          action: 'updated',
          entityType: 'event',
          entityId: eventId,
          eventId,
          details: { changedFields: [field], values: { [field]: prefix } },
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
    const { managers, names } = await this.partyService.listKnown(eventId);

    return {
      managers: managers.sort((a, b) => a.name.localeCompare(b.name)),
      names: names.sort((a, b) => a.localeCompare(b)),
      selfUserId,
    };
  }

  /** Everything the export and the receipt ZIP are built from. */
  async getExportData(eventId: string) {
    const [event, finance, expenses, payouts, incomes, categories] =
      await Promise.all([
        this.prisma.event.findUniqueOrThrow({
          where: { id: eventId },
          select: { currency: true },
        }),
        this.prisma.eventFinance.findUniqueOrThrow({
          where: { eventId },
          select: { payoutNumberPrefix: true, incomeNumberPrefix: true },
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
        this.prisma.income.findMany({
          where: { eventId },
          include: { files: { orderBy: { id: 'asc' } } },
          orderBy: { number: 'asc' },
        }),
        this.prisma.financeCategory.findMany({ where: { eventId } }),
      ]);

    return {
      currency: event.currency,
      payoutNumberPrefix: finance.payoutNumberPrefix,
      incomeNumberPrefix: finance.incomeNumberPrefix,
      expenses,
      payouts,
      incomes,
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
          paidOn: true,
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

  /** Manual income, and the registration fees received and still owed. */
  private async loadIncome(eventId: string, currency: string) {
    const paid = {
      where: { status: 'PAID' },
      select: {
        amount: true,
        refunds: {
          where: { status: 'REFUNDED' },
          select: { amount: true, amountDueReduction: true },
        },
      },
    } as const;
    const [incomes, payments, registrations] = await Promise.all([
      this.prisma.income.findMany({
        where: { eventId },
        select: { amount: true, receivedOn: true, categoryId: true },
      }),
      this.prisma.payment.findMany({
        where: { eventId, status: 'PAID' },
        select: {
          amount: true,
          currency: true,
          registration: { select: { group: true } },
          refunds: {
            where: { status: 'REFUNDED' },
            select: { amount: true },
          },
        },
      }),
      this.prisma.registration.findMany({
        where: { eventId },
        select: {
          group: true,
          status: true,
          currency: true,
          quotedAmount: true,
          amountDueOverride: true,
          payments: paid,
        },
      }),
    ]);

    const feeRegistrations = registrations.map((registration) => ({
      ...registration,
      accepted: registration.status === 'ACCEPTED',
      currency: registration.currency ?? currency,
    }));

    return {
      incomes,
      fees: summarizeFees(payments, feeRegistrations, currency),
    };
  }
}

const PREFIXES = {
  payout: {
    field: 'payoutNumberPrefix',
    counter: 'lastPayoutNumber',
    code: 'PAYOUT_PREFIX_LOCKED',
  },
  income: {
    field: 'incomeNumberPrefix',
    counter: 'lastIncomeNumber',
    code: 'INCOME_PREFIX_LOCKED',
  },
} as const;
