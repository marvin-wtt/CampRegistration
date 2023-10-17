export interface Expense {
  id: number;
  name: string;
  category?: string;
  price: number;
  paid: boolean;
  paidBy: string;
  date?: string;
  recipient?: string;
}
