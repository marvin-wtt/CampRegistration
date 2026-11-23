import {
  electronicFormatIBAN,
  friendlyFormatIBAN,
  isValidBIC,
  isValidIBAN,
} from 'ibantools';

// Thin wrappers, so callers don't depend on the library directly.

/** As stored: no spaces, upper case. */
export function normalizeIban(iban: string): string {
  return electronicFormatIBAN(iban) ?? '';
}

/** Check digits and the country's account format, on a typed IBAN. */
export function isValidIban(input: string): boolean {
  return isValidIBAN(normalizeIban(input));
}

/** Grouped in blocks of four, as printed: `DE89 3704 0044 …`. */
export function formatIban(iban: string): string {
  return friendlyFormatIBAN(iban) ?? '';
}

export function normalizeBic(bic: string): string {
  return bic.replace(/\s+/g, '').toUpperCase();
}

/** 8 or 11 characters with a valid country, on a normalized BIC. */
export function isValidBic(bic: string): boolean {
  return isValidBIC(bic);
}
