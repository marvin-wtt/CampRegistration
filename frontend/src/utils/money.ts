/**
 * Formats a decimal money string ("12.50") from the API. Amounts travel as
 * strings so no float ever touches them; converting only here, for display,
 * is safe at two decimals.
 */
export function formatMoney(
  amount: string | null,
  currency: string | null,
  locale: string,
): string {
  if (amount === null) {
    return '—';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency ?? 'EUR',
  }).format(Number(amount));
}
