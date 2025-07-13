import { writeToStream } from '@fast-csv/format';
import type { Response } from 'express';
import type { ExpenseWithFile } from '#app/expense/expense.exporter';

export const exportCSV = (expenses: ExpenseWithFile[], res: Response): void => {
  res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
  res.setHeader('Content-Type', 'text/csv');

  const output = expenses.map((expense) => {
    return {
      ...expense,
      file: expense.file?.name,
    };
  });

  writeToStream(res, output, {
    headers: true,
  });
};
