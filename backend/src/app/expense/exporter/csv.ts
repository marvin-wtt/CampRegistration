import { Expense } from '@camp-registration/common/entities';
import { write } from '@fast-csv/format';

export const exportCSV = (expenses: Expense[]) => {
  return {
    contentType: 'text/csv',
    fileExtension: '.csv',
    stream: write(expenses, {
      headers: true,
    }),
  };
};
