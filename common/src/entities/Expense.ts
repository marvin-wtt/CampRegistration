export interface Expense {
  id: number;
  name: string;
  category: string | null;
  price: number;
  paid: boolean;
  paidBy: string;
  date: string | null;
  recipient: string | null;
}
