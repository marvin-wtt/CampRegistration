import { Identifiable } from './Identifiable';
import { UndefinedForNull } from './utils';
import { ServiceFile } from './ServiceFile';

export interface Expense extends Identifiable {
  receiptNumber: number | null;
  name: string;
  description: string | null;
  category: string | null;
  amount: number;
  date: string;
  paidAt: string | null;
  paidBy: string | null;
  payee: string | null;
  file: ServiceFile | null;
}

export type ExpenseCreateData = UndefinedForNull<
  Omit<Expense, 'id' | 'file'>
> & {
  file?: File;
};

export type ExpenseUpdateData = Partial<ExpenseCreateData>;
