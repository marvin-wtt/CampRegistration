/**
 * Money is carried as integer minor units (cents) plus an ISO 4217 currency
 * code everywhere past the input boundary — never as a float, so sums and
 * refund limits are exact.
 */

/** Number of decimal places the currency uses (2 for EUR, 0 for JPY, 3 for KWD). */
export function currencyFractionDigits(currency: string): number {
  return (
    new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}

/** Converts a major-unit amount (`12.5` EUR) to minor units (`1250`), rounding half away from zero. */
export function toMinorUnits(amount: number, currency: string): number {
  const factor = 10 ** currencyFractionDigits(currency);
  const scaled = Math.abs(amount) * factor;
  // Correct binary float noise like 1.005 * 100 = 100.49999999999999 before rounding.
  const rounded = Math.round(Number(scaled.toPrecision(15)));

  return Math.sign(amount) * rounded;
}

/** Converts minor units (`1250`) back to a major-unit amount (`12.5`). */
export function fromMinorUnits(minor: number, currency: string): number {
  return minor / 10 ** currencyFractionDigits(currency);
}

/** Formats minor units for display, e.g. `formatMoney(1250, 'EUR', 'de-DE')` → `12,50 €`. */
export function formatMoney(
  minor: number,
  currency: string,
  locale?: string,
): string {
  const major = fromMinorUnits(minor, currency);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(major);
  } catch {
    // Unknown locale tag — fall back to the runtime's default locale.
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(major);
  }
}

/** The currency's symbol in `locale`, e.g. `€` or `CHF`. */
export function currencySymbol(currency: string, locale?: string): string {
  const part = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  })
    .formatToParts(0)
    .find((p) => p.type === 'currency');

  return part?.value ?? currency;
}
