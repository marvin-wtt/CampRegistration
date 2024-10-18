import { Expense, File } from '@prisma/client';
import type { Expense as ExpenseResource } from '@camp-registration/common/entities';
import fileResource from 'app/file/file.resource';

interface ExpenseWithFile extends Expense {
  file: File | null;
}

const expenseResource = (expense: ExpenseWithFile): ExpenseResource => {
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
    file: expense.file ? fileResource(expense.file) : null,
  };
};

export default expenseResource;
