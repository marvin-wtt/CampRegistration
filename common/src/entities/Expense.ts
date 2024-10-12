import { Identifiable } from './Identifiable';

export interface Expense extends Identifiable {
  receiptNumber: number | null;
  name: string;
  description: string | null;
  category: string | null;
  amount: number;
  date: string;
  paidAt: string | null;
  paidBy: string | null;
  recipient: string | null;
  fileId: string | null;
}

type UndefinedForNull<T> = {
  [K in keyof T]: T[K] extends null ? undefined : T[K];
};

export type ExpenseCreateData = UndefinedForNull<Omit<Expense, 'id'>>;

export type ExpenseUpdateData = Partial<ExpenseCreateData>;
