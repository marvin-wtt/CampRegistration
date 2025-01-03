import { Expense } from '@camp-registration/common/entities';
import { writeToStream } from '@fast-csv/format';
import { Response } from 'express';

export const exportCSV = (expenses: Expense[], res: Response): void => {
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
