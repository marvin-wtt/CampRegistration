import type { Request } from 'express';
import httpStatus from 'http-status';
import type { GuardFn } from '#core/guard';
import ApiError from '#core/router/ApiError';
import { resolve } from '#core/ioc/container';
import { EventService } from '#app/event/event.service';
import { IncomeService } from '#app/income/income.service';
import { hasEventPermission } from '#app/event/event.guard';

/** A grant letter or receipt is visible to whoever may see the income. */
export const incomeFileGuard = async (req: Request): Promise<GuardFn> => {
  const file = req.modelOrFail('file');
  if (!file.incomeId) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Invalid file guard handler',
    );
  }

  const income = await resolve(IncomeService).findIncome(file.incomeId);
  if (!income) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Income related to file not found',
    );
  }

  const event = await resolve(EventService).getEventById(income.eventId);
  req.setModelOrFail('event', event);
  req.setModel('income', income);

  return hasEventPermission('event.expenses.view');
};
