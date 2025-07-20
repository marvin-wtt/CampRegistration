import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { exportCSV } from '#app/expense/exporter/csv.expense.exporter.js';
import { exportExcelFGYO } from '#app/expense/exporter/excelFGYO/index';
import type { Response } from 'express';
import type { Expense } from '@camp-registration/common/entities';

export interface ExpenseExport {
  filename: string;
  contentType: string;
  stream: NodeJS.ReadableStream;
}

const exportExpenses = (
  type: string,
  expenses: Expense[],
  locale: string,
  res: Response,
): ExpenseExport | Promise<ExpenseExport> => {
  switch (type) {
    case 'csv':
      return exportCSV(expenses);
    case 'excel-fgyp':
      return exportExcelFGYO(expenses, locale, res);
    default:
      throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Invalid type ' + type);
  }
};

export { exportExpenses };
