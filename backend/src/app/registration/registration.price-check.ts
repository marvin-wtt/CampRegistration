import httpStatus from 'http-status';
import {
  REGISTRATION_PRICE_CHANGED,
  type RegistrationPriceCheck,
} from '@camp-registration/common/entities';
import ApiError from '#utils/ApiError';

/**
 * Refuses a submission whose price changed while its form was open, so nobody
 * is charged an amount they were never shown.
 *
 * `priceCheck` is untrusted client input. It is only ever compared here and
 * returns nothing: what a registration owes is always `quotedAmount`, the
 * server's own calculation. Never pass the displayed total on, store it or
 * charge it. Without a check (API clients, managers' forms) nothing is
 * compared.
 */
export function assertPriceUnchanged(
  quotedAmount: number,
  priceCheck: RegistrationPriceCheck | undefined,
): void {
  if (!priceCheck || priceCheck.displayedTotal === quotedAmount) {
    return;
  }

  throw new ApiError(
    httpStatus.CONFLICT,
    'The price changed while the form was open',
    { code: REGISTRATION_PRICE_CHANGED, details: { quotedAmount } },
  );
}
