import httpStatus from 'http-status';
import { REGISTRATION_PRICE_CHANGED } from '@camp-registration/common/entities';
import ApiError from '#core/router/ApiError';

/**
 * Refuses a submission whose price changed while its form was open, so nobody
 * is charged an amount they were never shown.
 *
 * `displayedTotal` is untrusted client input. It is only ever compared here and
 * returns nothing: what a registration owes is always `quotedAmount`, the
 * server's own calculation. Never pass the displayed total on, store it or
 * charge it. Without one (API clients, managers' forms) nothing is
 * compared.
 */
export function assertPriceUnchanged(
  quotedAmount: number,
  displayedTotal: number | undefined,
): void {
  if (displayedTotal === undefined || displayedTotal === quotedAmount) {
    return;
  }

  throw new ApiError(
    httpStatus.CONFLICT,
    'The price changed while the form was open',
    { code: REGISTRATION_PRICE_CHANGED, details: { quotedAmount } },
  );
}
