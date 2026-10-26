import {
  currencyFractionDigits,
  fromMinorUnits,
  toMinorUnits,
} from '@camp-registration/common/utils';

/** Minor units → a provider's decimal string, e.g. `1250, 'EUR'` → `"12.50"`. */
export function toDecimalString(minor: number, currency: string): string {
  return fromMinorUnits(minor, currency).toFixed(
    currencyFractionDigits(currency),
  );
}

/** A provider's decimal string → minor units. */
export function fromDecimalString(value: string, currency: string): number {
  return toMinorUnits(Number(value), currency);
}
