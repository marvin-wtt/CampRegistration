import { Prisma } from '#generated/prisma/client.js';

// A nullable JSON column takes `DbNull` rather than `null`; keep that spelling
// out of the callers, who deal in plain values.
export function dbNullable<T>(value: T | null | undefined) {
  return value === null ? Prisma.DbNull : value;
}
