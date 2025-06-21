import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { exportCSV } from '#app/expense/exporter/csv';
import { exportExcelFGYO } from '#app/expense/exporter/excelFGYO/index';
import type { Response } from 'express';
import type { Expense, File } from '@prisma/client';

export type ExpenseWithFile = Expense & { file?: File };

const exportExpenses = (
  type: string,
  expenses: ExpenseWithFile[],
  res: Response,
) => {
  switch (type) {
    case 'csv':
      exportCSV(expenses, res);
      return;
    case 'excel-fgyp':
      return exportExcelFGYO(expenses, res);
    default:
      throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Invalid type ' + type);
  }
};

export { exportExpenses };
