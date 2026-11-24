import type { File, Income, Prisma } from '#generated/prisma/client';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { AuditService } from '#app/audit/audit.service';
import { FileService } from '#app/file/file.service';
import { FinanceCategoryService } from '#app/financeCategory/finance-category.service';
import { incomeAuditPolicy } from '#app/income/income.audit';
import { nextFinanceNumber } from '#app/finance/finance.sequence';

export type IncomeView = Income & {
  finance: { incomeNumberPrefix: string };
  files: File[];
};

export interface IncomeWriteData {
  amount?: number | undefined;
  originalAmount?: number | null | undefined;
  originalCurrency?: string | null | undefined;
  receivedOn?: string | null | undefined;
  description?: string | undefined;
  payerName?: string | null | undefined;
  categoryId?: string | null | undefined;
  fileIds?: string[] | undefined;
}

const include = {
  finance: { select: { incomeNumberPrefix: true } },
  files: { orderBy: { id: 'asc' } },
} as const satisfies Prisma.IncomeInclude;

@injectable()
export class IncomeService extends BaseService {
  constructor(
    @inject(AuditService) private readonly audit: AuditService,
    @inject(FileService) private readonly fileService: FileService,
    @inject(FinanceCategoryService)
    private readonly categoryService: FinanceCategoryService,
  ) {
    super();
  }

  async getIncomeById(eventId: string, id: string) {
    return this.prisma.income.findFirst({ where: { id, eventId }, include });
  }

  /** Not scoped to an event: for the file guard, which starts from a file. */
  async findIncome(id: string) {
    return this.prisma.income.findUnique({ where: { id }, include });
  }

  async queryIncomes(eventId: string) {
    return this.prisma.income.findMany({
      where: { eventId },
      include,
      orderBy: { number: 'asc' },
    });
  }

  async createIncome(
    eventId: string,
    data: IncomeWriteData & { amount: number; description: string },
    createdByUserId: string,
    sessionId: string,
  ) {
    return this.transaction(async (tx) => {
      if (data.categoryId) {
        await this.categoryService.assertAssignable(
          eventId,
          data.categoryId,
          'INCOME',
        );
      }

      const number = await nextFinanceNumber(tx, eventId, 'income');

      const income = await tx.income.create({
        data: {
          eventId,
          number,
          amount: data.amount,
          originalAmount: data.originalAmount ?? null,
          originalCurrency: data.originalCurrency ?? null,
          receivedOn: data.receivedOn ?? null,
          description: data.description,
          payerName: data.payerName ?? null,
          categoryId: data.categoryId ?? null,
          createdByUserId,
          files: data.fileIds?.length
            ? this.fileService.getFileConnectInput(data.fileIds, sessionId)
            : undefined,
        },
        include,
      });

      await this.audit.created(incomeAuditPolicy, income);

      return income;
    });
  }

  async updateIncome(
    income: IncomeView,
    data: IncomeWriteData,
    sessionId: string,
  ) {
    return this.transaction(async (tx) => {
      if (data.categoryId && data.categoryId !== income.categoryId) {
        await this.categoryService.assertAssignable(
          income.eventId,
          data.categoryId,
          'INCOME',
        );
      }

      const files = data.fileIds
        ? await this.fileService.syncFilesForOwner(
            tx,
            'incomeId',
            income.id,
            data.fileIds,
            sessionId,
          )
        : undefined;

      const after = await tx.income.update({
        where: { id: income.id },
        data: {
          amount: data.amount,
          originalAmount: data.originalAmount,
          originalCurrency: data.originalCurrency,
          receivedOn: data.receivedOn,
          description: data.description,
          payerName: data.payerName,
          categoryId: data.categoryId,
          files,
        },
        include,
      });

      await this.audit.updated(incomeAuditPolicy, income, after);

      return after;
    });
  }

  async deleteIncome(income: IncomeView) {
    await this.transaction(async (tx) => {
      await tx.income.delete({ where: { id: income.id } });
      await this.audit.deleted(incomeAuditPolicy, income);
    });
  }
}
