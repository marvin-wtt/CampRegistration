import type { Request } from 'express';
import httpStatus from 'http-status';
import type { GuardFn } from '#core/guard';
import ApiError from '#core/router/ApiError';
import { resolve } from '#core/ioc/container';
import { EventService } from '#app/event/event.service';
import { ExpenseService } from '#app/expense/expense.service';
import { hasEventPermission } from '#app/event/event.guard';

/** A receipt file is visible to whoever may see its expense. */
export const expenseFileGuard = async (req: Request): Promise<GuardFn> => {
  const file = req.modelOrFail('file');
  if (!file.expenseId) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Invalid file guard handler',
    );
  }

  const expense = await resolve(ExpenseService).findExpense(file.expenseId);
  if (!expense) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Expense related to file not found',
    );
  }

  const event = await resolve(EventService).getEventById(expense.eventId);
  req.setModelOrFail('event', event);
  req.setModel('expense', expense);

  return hasEventPermission('event.expenses.view', { own: 'expense' });
};
