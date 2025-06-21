import { useExcel } from '#app/expense/exporter/excel.js';
import ApiError from '#utils/ApiError.js';
import httpStatus from 'http-status';
import type {
  ReceiptListFileConfig,
  BudgetCategories,
} from '#app/expense/exporter/excelFGYO/ReceiptListFileConfig';
import type { Response } from 'express';
import type { ExpenseWithFile } from '#app/expense/expense.exporter.js';

export const exportExcelFGYO = async (
  data: ExpenseWithFile[],
  res: Response,
) => {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', 'attachment; filename="expenses.xlsx"');

  const config: ReceiptListFileConfig = {};

  const { income, eligibleExpenditures, nonEligibleExpenditures } =
    prepareFGYOExcelData(data, {
      income: config.sections.income.categories,
      eligibleExpenses: config.sections.eligibleExpenses.categories,
      nonEligibleExpenses: config.sections.nonEligibleExpenses.categories,
    });

  const { writeWithDefault, duplicateRows } = await useExcel(config.file);

  const timestampDate = (timestamp: string | null): string | null => {
    return timestamp?.split('T')[0] ?? null;
  };

  const addInformation = (startRow: number) => {
    const expenditures = [...eligibleExpenditures, ...nonEligibleExpenditures];
    const totalExpenditures = expenditures.reduce(
      (acc, val) => acc + val.amount,
      0,
    );
    writeWithDefault('F', startRow, totalExpenditures, 0);

    const totalIncome = income.reduce((acc, val) => acc + val.amount, 0);
    writeWithDefault('G', startRow, totalIncome, 0);
  };

  const addIncome = (startRow: number, rowCount: number) => {
    duplicateRows(startRow, rowCount, nonEligibleExpenditures.length);

    income.forEach((value, index) => {
      const row = startRow + index;

      writeWithDefault('A', row, value.name);
      writeWithDefault('B', row, value.receiptNumber);
      writeWithDefault('C', row, timestampDate(value.date));
      writeWithDefault('D', row, value.payee);
      writeWithDefault('E', row, value.category);
      writeWithDefault('G', row, value.amount);
    });
  };

  const addNonEligibleExpenditures = (startRow: number, rowCount: number) => {
    duplicateRows(startRow, rowCount, nonEligibleExpenditures.length);

    nonEligibleExpenditures.forEach((value, index) => {
      const row = startRow + index;

      writeWithDefault('A', row, value.name);
      writeWithDefault('F', row, value.amount);
    });
  };

  const addEligibleExpenditures = (startRow: number, rowCount: number) => {
    duplicateRows(startRow, rowCount, eligibleExpenditures.length);

    eligibleExpenditures.forEach((value, index) => {
      const row = startRow + index;

      writeWithDefault('A', row, value.name);
      writeWithDefault('B', row, value.receiptNumber);
      writeWithDefault('C', row, timestampDate(value.date));
      writeWithDefault('D', row, value.payee);
      writeWithDefault('E', row, value.category);
      writeWithDefault('F', row, value.amount);
    });
  };

  const sections: Record<string, (startRow: number, rowCount: number) => void> =
    {
      eligibleExpenditures: addEligibleExpenditures,
      nonEligibleExpenditures: addNonEligibleExpenditures,
      income: addIncome,
      information: addInformation,
    };

  // Execute in reverse order as new rows are appended at the end of each section
  Object.entries(config.sections)
    .filter(([name]) => name in sections)
    .map(([name, section]) => ({
      ...section,
      fn: sections[name],
    }))
    .sort((a, b) => b.startRow - a.startRow)
    .forEach((section) => {
      section.fn(section.startRow, section.rowCount);
    });

  throw new ApiError(httpStatus.NOT_IMPLEMENTED, 'Not implemented');
};

const prepareFGYOExcelData = (
  data: Expense[],
  categories: BudgetCategories,
) => {
  const eligibleExpenditures: Expense[] = [];
  const nonEligibleExpenditures: Expense[] = [];
  const income: Expense[] = [];

  data.forEach((expense) => {
    if (expense.amount === 0) return;

    // Income
    if (expense.amount < 0) {
      if (
        !expense.category ||
        !Object.values(categories.income).includes(expense.category)
      ) {
        expense = {
          ...expense,
          amount: expense.amount * -1,
          category: categories.income.others,
        };
      }

      income.push(expense);
      return;
    }

    // Eligible expenditures
    if (
      expense.category &&
      Object.values(categories.eligibleExpenses).includes(expense.category)
    ) {
      eligibleExpenditures.push(expense);
      return;
    }

    // Non-eligible expenditures
    if (
      !expense.category ||
      !Object.values(categories.nonEligibleExpenses).includes(expense.category)
    ) {
      expense = {
        ...expense,
        category: categories.nonEligibleExpenses.others,
      };
    }

    nonEligibleExpenditures.push(expense);
  });

  return {
    income,
    eligibleExpenditures,
    nonEligibleExpenditures,
  };
};
