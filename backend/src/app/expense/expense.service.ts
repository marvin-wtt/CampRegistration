import type { Expense, File, Prisma } from '#generated/prisma/client';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { ownedWhere } from '#core/permission/ownership';
import { AuditService } from '#app/audit/audit.service';
import { FileService } from '#app/file/file.service';
import { ExpenseCategoryService } from '#app/expenseCategory/expense-category.service';
import { FinancePartyService } from '#app/finance/finance-party.service';
import { expenseAuditPolicy } from '#app/expense/expense.audit';
import { nextFinanceNumber } from '#app/finance/finance.sequence';
import type { ExpenseType } from '@camp-registration/common/entities';

export type ExpenseWithFiles = Expense & { files: File[] };

export interface ExpenseFilter {
  categoryId?: string | undefined;
  paidByUserId?: string | undefined;
  paidByName?: string | undefined;
  missingFile?: boolean | undefined;
  /** Limits the list to the expenses this user owns. */
  ownerId?: string | undefined;
}

export interface ExpenseWriteData {
  type?: ExpenseType | undefined;
  amount?: number | undefined;
  originalAmount?: number | null | undefined;
  originalCurrency?: string | null | undefined;
  date?: string | null | undefined;
  description?: string | undefined;
  categoryId?: string | null | undefined;
  paidByUserId?: string | null | undefined;
  paidByName?: string | null | undefined;
  fileIds?: string[] | undefined;
}

const include = {
  files: { orderBy: { id: 'asc' } },
} as const satisfies Prisma.ExpenseInclude;

@injectable()
export class ExpenseService extends BaseService {
  constructor(
    @inject(AuditService) private readonly audit: AuditService,
    @inject(FileService) private readonly fileService: FileService,
    @inject(ExpenseCategoryService)
    private readonly categoryService: ExpenseCategoryService,
    @inject(FinancePartyService)
    private readonly partyService: FinancePartyService,
  ) {
    super();
  }

  async getExpenseById(eventId: string, id: string) {
    return this.prisma.expense.findFirst({
      where: { id, eventId },
      include,
    });
  }

  /** Not scoped to an event: for the file guard, which starts from a file. */
  async findExpense(id: string) {
    return this.prisma.expense.findUnique({
      where: { id },
      include,
    });
  }

  async queryExpenses(eventId: string, filter: ExpenseFilter = {}) {
    return this.prisma.expense.findMany({
      where: {
        eventId,
        categoryId: filter.categoryId,
        paidByUserId: filter.paidByUserId,
        paidByName: filter.paidByUserId ? undefined : filter.paidByName,
        files: filter.missingFile ? { none: {} } : undefined,
        ...(filter.ownerId ? ownedWhere('expense', filter.ownerId) : {}),
      },
      include,
      orderBy: { receiptNumber: 'asc' },
    });
  }

  async createExpense(
    eventId: string,
    data: ExpenseWriteData & {
      amount: number;
      description: string;
    },
    createdByUserId: string,
    sessionId: string,
  ) {
    return this.transaction(async (tx) => {
      if (data.categoryId) {
        await this.categoryService.assertAssignable(eventId, data.categoryId);
      }
      const payer = await this.partyService.resolveParty(eventId, {
        userId: data.paidByUserId,
        name: data.paidByName,
      });

      const receiptNumber = await nextFinanceNumber(tx, eventId, 'receipt');

      const expense = await tx.expense.create({
        data: {
          eventId,
          receiptNumber,
          type: data.type ?? 'EXPENSE',
          amount: data.amount,
          originalAmount: data.originalAmount ?? null,
          originalCurrency: data.originalCurrency ?? null,
          date: data.date ?? null,
          description: data.description,
          categoryId: data.categoryId ?? null,
          paidByUserId: payer.userId,
          paidByName: payer.name,
          createdByUserId,
          files: data.fileIds?.length
            ? this.fileService.getFileConnectInput(data.fileIds, sessionId)
            : undefined,
        },
        include,
      });

      await this.audit.created(expenseAuditPolicy, expense);

      return expense;
    });
  }

  async updateExpense(
    expense: ExpenseWithFiles,
    data: ExpenseWriteData,
    sessionId: string,
  ) {
    return this.transaction(async (tx) => {
      if (data.categoryId && data.categoryId !== expense.categoryId) {
        await this.categoryService.assertAssignable(
          expense.eventId,
          data.categoryId,
        );
      }

      const payerChanged =
        data.paidByUserId !== undefined || data.paidByName !== undefined;
      const payer = payerChanged
        ? await this.resolveChangedPayer(expense, data)
        : undefined;

      const files = data.fileIds
        ? await this.fileService.syncFilesForOwner(
            tx,
            'expenseId',
            expense.id,
            data.fileIds,
            sessionId,
          )
        : undefined;

      const after = await tx.expense.update({
        where: { id: expense.id },
        data: {
          type: data.type,
          amount: data.amount,
          originalAmount: data.originalAmount,
          originalCurrency: data.originalCurrency,
          date: data.date,
          description: data.description,
          categoryId: data.categoryId,
          paidByUserId: payer?.userId,
          paidByName: payer?.name,
          files,
        },
        include,
      });

      await this.audit.updated(expenseAuditPolicy, expense, after);

      return after;
    });
  }

  async deleteExpense(expense: ExpenseWithFiles) {
    await this.transaction(async (tx) => {
      await tx.expense.delete({ where: { id: expense.id } });
      await this.audit.deleted(expenseAuditPolicy, expense);
    });
  }

  /**
   * A manager who has since left keeps their snapshot when the payer is sent
   * back unchanged; picking someone anew must be a current manager.
   */
  private async resolveChangedPayer(expense: Expense, data: ExpenseWriteData) {
    const userId =
      data.paidByUserId !== undefined
        ? data.paidByUserId
        : expense.paidByUserId;
    if (userId && userId === expense.paidByUserId) {
      return { userId, name: expense.paidByName };
    }

    return this.partyService.resolveParty(expense.eventId, {
      userId,
      name: data.paidByName,
    });
  }
}
