import ApiError from '#utils/ApiError.js';
import httpStatus from 'http-status';
import { Expense } from '@camp-registration/common/entities';
import { exportCSV } from '#app/expense/exporter/csv';
import { exportExcelFGYO } from '#app/expense/exporter/excelFGYO/index.js';
import { Response } from 'express';

const exportExpenses = (type: string, expenses: Expense[], res: Response) => {
  switch (type) {
    case 'csv':
      return exportCSV(expenses, res);
    case 'excel-fgyp':
      return exportExcelFGYO(expenses, res);
    default:
      throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Invalid type ' + type);
  }
};

export { exportExpenses };
