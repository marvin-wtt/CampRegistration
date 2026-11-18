import {
  currencyFractionDigits,
  fromMinorUnits,
} from '@camp-registration/common/utils';

/** Enough digits for any receipt, short of what the API refuses. */
export const MAX_AMOUNT_DIGITS = 9;

/**
 * The digits typed into a cash-register style amount field, as minor units:
 * every digit shifts the amount left, so `4780` reads as `47,80`. Separators,
 * spaces and anything else are ignored; leading zeros don't count.
 */
export function amountDigits(text: string): string {
  return text.replace(/\D/g, '').replace(/^0+/, '').slice(0, MAX_AMOUNT_DIGITS);
}

/** Minor units formatted for the field, e.g. `1.234,50` in German. */
export function formatAmountDigits(
  minor: number,
  currency: string,
  locale?: string,
): string {
  const digits = currencyFractionDigits(currency);

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(fromMinorUnits(minor, currency));
}
