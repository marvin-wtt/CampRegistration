/**
 * Transfer references (`K7MX-0042`): the event's code and the registration's
 * number. Digits and upper-case letters without 0/O and 1/I, which are
 * misread on a bank statement.
 */
export const REFERENCE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const REFERENCE_CODE_LENGTH = 4;

export function formatPaymentReference(code: string, number: number): string {
  return `${code}-${String(number).padStart(4, '0')}`;
}

/**
 * Reads a reference as typed or copied from a statement: any case, with or
 * without the dash, spaces ignored. `null` when it isn't one.
 */
export function parsePaymentReference(
  input: string,
): { code: string; number: number } | null {
  const match = /^([0-9A-Z]{4})-?(\d+)$/.exec(
    input.replace(/\s+/g, '').toUpperCase(),
  );
  if (!match?.[1] || !match[2]) {
    return null;
  }

  return { code: match[1], number: Number(match[2]) };
}
