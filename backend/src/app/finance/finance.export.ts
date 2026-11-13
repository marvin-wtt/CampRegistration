import i18n from '#core/i18n/i18n.client';
import type { CellValue, Sheet } from '#utils/spreadsheet';
import { computeCategoryTotals } from '#app/finance/finance.balances';
import { fromMinorUnits, translate } from '@camp-registration/common/utils';
import type {
  Expense,
  ExpenseCategory,
  File,
  Payout,
} from '#generated/prisma/client';

export interface FinanceExportData {
  currency: string;
  payoutNumberPrefix: string;
  expenses: (Expense & { files: Pick<File, 'id'>[] })[];
  payouts: Payout[];
  categories: ExpenseCategory[];
}

const MONEY = '#,##0.00';
const DATE = 'yyyy-mm-dd';

/** `YYYY-MM-DD` as a date Excel can sort and sum by. */
function excelDate(date: string): Date;
function excelDate(date: string | null): Date | null;
function excelDate(date: string | null): Date | null {
  return date ? new Date(`${date}T00:00:00Z`) : null;
}

/**
 * Expenses, payouts and category totals as sheets for the treasurer's own
 * tool. Payouts stay on a sheet of their own: they are transfers, not costs,
 * and a tool importing everything as expenses would count money twice.
 */
export function buildFinanceSheets(
  data: FinanceExportData,
  locale: string,
): Sheet[] {
  const t = i18n.getFixedT(locale, 'finance', 'export');
  const money = (minor: number) => fromMinorUnits(minor, data.currency);
  const name = (value: unknown) =>
    translate(value as string | Record<string, string>, locale) ?? '';

  const categories = new Map(data.categories.map((c) => [c.id, c]));
  const categoryName = (id: string | null) => {
    const category = id ? categories.get(id) : undefined;
    return category ? name(category.name) : '';
  };
  const groupName = (id: string | null) =>
    categoryName((id ? categories.get(id)?.parentId : null) ?? null);

  const expenseRows: CellValue[][] = data.expenses.map((e) => [
    e.receiptNumber,
    excelDate(e.date),
    t(`value.${e.type}`),
    e.description,
    groupName(e.categoryId),
    categoryName(e.categoryId),
    e.paidByName ?? t('value.eventFunds'),
    money(e.amount),
    money(e.type === 'REFUND' ? -e.amount : e.amount),
    data.currency,
    e.originalAmount !== null && e.originalCurrency
      ? fromMinorUnits(e.originalAmount, e.originalCurrency)
      : null,
    e.originalCurrency,
    e.files.length,
  ]);

  const totals = computeCategoryTotals(data.expenses);
  const categoryRows: CellValue[][] = totals
    .map((total) => [
      groupName(total.categoryId),
      total.categoryId
        ? categoryName(total.categoryId)
        : t('value.uncategorized'),
      money(total.expenses),
      money(total.refunds),
      money(total.total),
      total.count,
    ])
    .sort(
      (a, b) =>
        String(a[0]).localeCompare(String(b[0])) ||
        String(a[1]).localeCompare(String(b[1])),
    );
  const sum = (key: 'expenses' | 'refunds' | 'total') =>
    money(totals.reduce((acc, total) => acc + total[key], 0));

  return [
    {
      name: t('sheet.expenses'),
      columns: [
        { header: t('column.receiptNumber'), width: 10 },
        { header: t('column.date'), width: 12, numFmt: DATE },
        { header: t('column.type'), width: 12 },
        { header: t('column.description'), width: 32 },
        { header: t('column.group'), width: 18 },
        { header: t('column.category'), width: 18 },
        { header: t('column.paidBy'), width: 22 },
        { header: t('column.amount'), width: 12, numFmt: MONEY },
        { header: t('column.net'), width: 12, numFmt: MONEY },
        { header: t('column.currency'), width: 9 },
        { header: t('column.originalAmount'), width: 14, numFmt: MONEY },
        { header: t('column.originalCurrency'), width: 9 },
        { header: t('column.files'), width: 8 },
      ],
      rows: expenseRows,
    },
    {
      name: t('sheet.payouts'),
      columns: [
        { header: t('column.number'), width: 8 },
        { header: t('column.paidOn'), width: 12, numFmt: DATE },
        { header: t('column.direction'), width: 14 },
        { header: t('column.person'), width: 24 },
        { header: t('column.amount'), width: 12, numFmt: MONEY },
        { header: t('column.currency'), width: 9 },
        { header: t('column.note'), width: 32 },
      ],
      rows: data.payouts.map((p) => [
        `${data.payoutNumberPrefix}${p.number.toString()}`,
        excelDate(p.paidOn),
        t(`value.${p.direction}`),
        p.recipientName,
        money(p.amount),
        data.currency,
        p.note,
      ]),
    },
    {
      name: t('sheet.categories'),
      columns: [
        { header: t('column.group'), width: 20 },
        { header: t('column.category'), width: 20 },
        { header: t('column.expenses'), width: 12, numFmt: MONEY },
        { header: t('column.refunds'), width: 12, numFmt: MONEY },
        { header: t('column.total'), width: 12, numFmt: MONEY },
        { header: t('column.count'), width: 9 },
      ],
      rows: categoryRows,
      footer: [
        [
          t('value.total'),
          null,
          sum('expenses'),
          sum('refunds'),
          sum('total'),
          data.expenses.length,
        ],
      ],
    },
  ];
}

/**
 * Receipt files named by receipt number, as written on the paper: `017.jpg`,
 * and `017-2.jpg` for a receipt's further pages.
 */
export function receiptFileNames<F extends { originalName: string }>(
  expenses: { receiptNumber: number; files: F[] }[],
): { file: F; name: string }[] {
  const width = Math.max(
    3,
    ...expenses.map((e) => e.receiptNumber.toString().length),
  );

  return expenses.flatMap((expense) =>
    expense.files.map((file, index) => {
      const extension = /\.[a-z0-9]{1,8}$/i.exec(file.originalName)?.[0] ?? '';
      const number = expense.receiptNumber.toString().padStart(width, '0');
      const suffix = index === 0 ? '' : `-${(index + 1).toString()}`;
      return { file, name: `${number}${suffix}${extension.toLowerCase()}` };
    }),
  );
}

export function exportFileName(locale: string, extension: string): string {
  const base = i18n.getFixedT(locale, 'finance', 'export')('file');
  return `${base}-${new Date().toISOString().slice(0, 10)}.${extension}`;
}
