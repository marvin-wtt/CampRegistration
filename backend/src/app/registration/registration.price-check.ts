import httpStatus from 'http-status';
import { REGISTRATION_PRICE_CHANGED } from '@camp-registration/common/entities';
import { MAX_AMOUNT_DUE } from '@camp-registration/common/utils';
import ApiError from '#core/router/ApiError';

/**
 * Refuses a submission whose price changed while its form was open, so nobody
 * is charged an amount they were never shown. The form then asks the person
 * to reload the page and register again.
 *
 * `displayedTotal` is untrusted client input. It is only ever compared here and
 * returns nothing: what a registration owes is always `quotedAmount`, the
 * server's own calculation. Never pass the displayed total on, store it or
 * charge it. Without one (API clients, managers' forms, a form that showed no
 * price) nothing is compared.
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
    { code: REGISTRATION_PRICE_CHANGED },
  );
}

/**
 * Refuses a quote too large to store. Prices come from the form, and an
 * expression over a typed answer can grow without bound.
 */
export function assertAmountWithinLimit(quotedAmount: number): void {
  if (quotedAmount > MAX_AMOUNT_DUE) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'The amount due exceeds the maximum',
    );
  }
}
