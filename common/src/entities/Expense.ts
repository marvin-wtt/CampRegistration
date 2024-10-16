import { Identifiable } from './Identifiable';
import { UndefinedForNull } from './utils';

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
  fileId: string | null;
}

export type ExpenseCreateData = UndefinedForNull<Omit<Expense, 'id'>>;

export type ExpenseUpdateData = Partial<ExpenseCreateData>;
