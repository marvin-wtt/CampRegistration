import type { Request } from 'express';
import { campManager, type GuardFn } from '#guards/index';
import expenseService from '#app/expense/expense.service';
import campService from '#app/camp/camp.service';

export const expenseFileGuard = async (req: Request): Promise<GuardFn> => {
  const file = req.modelOrFail('file');

  if (!file.expenseId) {
    throw new Error('Invalid guard handler: expenseId not found in file');
  }

  const expense = await expenseService.getExpenseWithCampById(file.expenseId);
  if (!expense) {
    throw new Error('Expense related to file not found');
  }
  const camp = await campService.getCampById(expense.camp.id);

  req.setModelOrFail('expense', expense);
  req.setModelOrFail('camp', camp);

  return campManager('camp.expenses.view');
};
