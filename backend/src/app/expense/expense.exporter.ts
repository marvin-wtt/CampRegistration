import ApiError from '#utils/ApiError.js';
import httpStatus from 'http-status';
import Stream from 'node:stream';
import { Expense } from '@camp-registration/common/entities';
import { exportCSV } from '#app/expense/exporter/csv';
import { exportExcelFGYO } from '#app/expense/exporter/excelFGYO/index.js';

interface ExpenseExport {
  contentType: string;
  fileExtension: string;
  stream: Stream;
}

const exportExpenses = (type: string, expenses: Expense[]): ExpenseExport => {
  switch (type) {
    case 'csv':
      return exportCSV(expenses);
    case 'excel-fgyp':
      return exportExcelFGYO(expenses);
    default:
      throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Invalid type ' + type);
  }
};

export { exportExpenses };
