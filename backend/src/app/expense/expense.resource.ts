import { Expense } from '@prisma/client';
import type { Expense as ExpenseResource } from '@camp-registration/common/entities';

const expenseResource = (expense: Expense): ExpenseResource => {
  return {
    id: expense.id,
    receiptNumber: expense.receiptNumber,
    name: expense.name,
    description: expense.description,
    category: expense.category,
    amount: expense.amount.toNumber(),
    date: expense.date?.toISOString() ?? null,
    paidAt: expense.paidAt?.toISOString() ?? null,
    paidBy: expense.paidBy,
    payee: expense.payee,
    fileId: expense.fileId,
  };
};

export default expenseResource;
