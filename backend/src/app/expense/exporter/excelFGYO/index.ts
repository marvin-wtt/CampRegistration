import { useExcel } from '#app/expense/exporter/excel.expense.exporter';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import type {
  ReceiptListFileConfig,
  BudgetCategories,
} from '#app/expense/exporter/excelFGYO/ReceiptListFileConfig';
import type { Response } from 'express';
import { receiptListConfigs } from '#app/expense/exporter/excelFGYO/receiptListConfigs';
import type { Expense } from '@camp-registration/common/entities';
import { publicPath } from '#utils/paths.js';
import { objectValueByPath } from '@camp-registration/web/src/utils/objectValueByPath.js';

export const exportExcelFGYO = async (data: Expense[], res: Response) => {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', 'attachment; filename="expenses.xlsx"');

  // TODO Use the locale from the request or user settings
  const config: ReceiptListFileConfig = receiptListConfigs.de;

  const { income, eligibleExpenditures, nonEligibleExpenditures } =
    prepareFGYOExcelData(data, {
      income: config.sections.income.categories,
      eligible: config.sections.eligibleExpenses.categories,
      nonEligible: config.sections.nonEligibleExpenses.categories,
    });

  const { writeWithDefault, duplicateRows } = await useExcel(
    publicPath(config.file),
  );

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
  data.forEach((expense) => {
    // If the category is not defined or not a string, assign the default category
    if (
      !expense.category.startsWith('fgyo.') ||
      typeof objectValueByPath(
        expense.category.replace('fgyo.', ''),
        categories,
      ) !== 'string'
    ) {
      expense.category =
        expense.amount >= 0 ? 'fgyo.nonEligible.others' : 'fgyo.income.others';
    }

    expense.category = expense.category.replace('fgyo.', '');
  });

  const eligibleExpenditures: Expense[] = data
    .filter((expense) => expense.category.startsWith('eligible.'))
    .map((expense) => ({
      ...expense,
      category: objectValueByPath(
        expense.category,
        categories.eligible,
      ) as string,
    }));
  const nonEligibleExpenditures: Expense[] = data
    .filter((expense) => expense.category.startsWith('nonEligible.'))
    .map((expense) => ({
      ...expense,
      category: objectValueByPath(
        expense.category,
        categories.eligible,
      ) as string,
    }));
  const income: Expense[] = data
    .filter((expense) => expense.category.startsWith('income.'))
    .map((expense) => ({
      ...expense,
      category: objectValueByPath(
        expense.category,
        categories.eligible,
      ) as string,
    }));

  return {
    income,
    eligibleExpenditures,
    nonEligibleExpenditures,
  };
};
