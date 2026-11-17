import type { Request } from 'express';
import httpStatus from 'http-status';
import type { GuardFn } from '#core/guard';
import ApiError from '#core/router/ApiError';
import { resolve } from '#core/ioc/container';
import { EventService } from '#app/event/event.service';
import { PayoutService } from '#app/payout/payout.service';
import { hasEventPermission } from '#app/event/event.guard';

/** A scan of a signed slip is visible to whoever may see its payout. */
export const payoutFileGuard = async (req: Request): Promise<GuardFn> => {
  const file = req.modelOrFail('file');
  if (!file.payoutId) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Invalid file guard handler',
    );
  }

  const payout = await resolve(PayoutService).findPayout(file.payoutId);
  if (!payout) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Payout related to file not found',
    );
  }

  const event = await resolve(EventService).getEventById(payout.eventId);
  req.setModelOrFail('event', event);
  req.setModel('payout', payout);

  return hasEventPermission('event.payouts.view', { own: 'payout' });
};
