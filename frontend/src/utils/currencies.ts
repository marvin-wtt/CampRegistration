export interface CurrencyOption {
  /** ISO 4217 code, e.g. CHF. */
  value: string;
  /** In the viewer's language, e.g. "Swiss Franc". */
  name: string;
}

/** Every current ISO 4217 currency the browser knows, by code. */
export function currencyOptions(locale: string): CurrencyOption[] {
  const names = new Intl.DisplayNames(locale, {
    type: 'currency',
    fallback: 'code',
  });

  return Intl.supportedValuesOf('currency').map((value) => ({
    value,
    name: names.of(value) ?? value,
  }));
}
