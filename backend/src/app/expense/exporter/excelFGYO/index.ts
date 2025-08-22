import { publicPath } from '#utils/paths.js';
import type { Expense } from '@camp-registration/common/entities';
import { receiptListConfigs } from './receiptListConfigs.js';
import { ExcelExporter } from '../excel.expense.exporter.js';
import { prepareFGYOExcelData } from './prepareFGYOExcelData.js';
import type { ExpenseExport } from '#app/expense/expense.exporter';

export const exportExcelFGYO = async (
  data: Expense[],
  locale: string,
): Promise<ExpenseExport> => {
  const configKey = locale.split('-')[0]?.toLowerCase();

  const config =
    configKey in receiptListConfigs
      ? receiptListConfigs[configKey as keyof typeof receiptListConfigs]
      : receiptListConfigs.de;

  const all = prepareFGYOExcelData(data, {
    income: config.sections.income.categories,
    eligible: config.sections.eligibleExpenses.categories,
    nonEligible: config.sections.nonEligibleExpenses.categories,
  });

  const eligibleExpenditures = all.filter((e) => e.section === 'eligible');
  const nonEligibleExpenditures = all.filter(
    (e) => e.section === 'nonEligible',
  );
  const income = all.filter((e) => e.section === 'income');

  const xl = (await ExcelExporter.from(publicPath(config.file))).worksheet(
    config.worksheet,
  );

  const dateOnly = (iso: string | null) => iso?.slice(0, 10) ?? null;

  const addRows = <T extends Expense[]>(
    rows: T,
    start: number,
    template: number,
    cb: (rowIdx: number, item: T[number]) => void,
  ) => {
    xl.ensureRows(start, template, rows.length);
    rows.forEach((item, i) => {
      cb(start + i, item);
    });
  };

  // Eligible
  addRows(
    eligibleExpenditures,
    config.sections.eligibleExpenses.startRow,
    config.sections.eligibleExpenses.rowCount,
    (row, v) => {
      xl.write('A', row, v.name)
        .write('B', row, v.receiptNumber)
        .write('C', row, dateOnly(v.date))
        .write('D', row, v.payee)
        .write('E', row, v.category)
        .write('F', row, v.amount);
    },
  );

  // Non-eligible
  addRows(
    nonEligibleExpenditures,
    config.sections.nonEligibleExpenses.startRow,
    config.sections.nonEligibleExpenses.rowCount,
    (row, v) => {
      xl.write('A', row, v.name).write('F', row, v.amount);
    },
  );

  // Income
  addRows(
    income,
    config.sections.income.startRow,
    config.sections.income.rowCount,
    (row, v) => {
      xl.write('A', row, v.name)
        .write('B', row, v.receiptNumber)
        .write('C', row, dateOnly(v.date))
        .write('D', row, v.payee)
        .write('E', row, v.category)
        .write('G', row, v.amount);
    },
  );

  const totalsRow =
    Math.max(
      config.sections.income.startRow,
      config.sections.nonEligibleExpenses.startRow,
      config.sections.eligibleExpenses.startRow,
    ) +
    Math.max(
      income.length,
      nonEligibleExpenditures.length,
      eligibleExpenditures.length,
    );

  xl.write(
    'F',
    totalsRow,
    eligibleExpenditures
      .concat(nonEligibleExpenditures)
      .reduce((a, { amount }) => a + amount, 0),
    0,
  );
  xl.write(
    'G',
    totalsRow,
    income.reduce((a, { amount }) => a + amount, 0),
    0,
  );

  return {
    stream: xl.toStream(),
    filename: 'expenses.xlsx',
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
};
