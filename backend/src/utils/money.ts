import type { Prisma } from '#generated/prisma/client.js';

/** Money leaves as a fixed two-decimal string, never as a float. */
export function money(value: Prisma.Decimal): string;
export function money(value: Prisma.Decimal | null): string | null;
export function money(value: Prisma.Decimal | null): string | null {
  return value?.toFixed(2) ?? null;
}
