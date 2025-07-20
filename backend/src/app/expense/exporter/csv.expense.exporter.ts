import { writeToStream } from '@fast-csv/format';
import type { Expense } from '@camp-registration/common/entities';
import type { ExpenseExport } from '#app/expense/expense.exporter';
import { PassThrough } from 'node:stream';

export const exportCSV = (expenses: Expense[]): ExpenseExport => {
  const output = expenses.map((expense) => {
    return {
      ...expense,
      file: expense.file?.url,
    };
  });

  const stream = new PassThrough();

  writeToStream(stream, output, { headers: true }).once('error', (err) =>
    stream.destroy(err),
  );

  return {
    filename: 'expenses.csv',
    contentType: 'text/csv',
    stream,
  };
};
