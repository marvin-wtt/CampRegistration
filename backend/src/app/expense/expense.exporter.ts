import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { exportCSV } from '#app/expense/exporter/csv.expense.exporter.js';
import { exportExcelFGYO } from '#app/expense/exporter/excelFGYO/index';
import type { Response } from 'express';
import type { Expense } from '@camp-registration/common/entities';

const exportExpenses = (type: string, expenses: Expense[], res: Response) => {
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
