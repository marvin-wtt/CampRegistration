import { Prisma } from '#generated/prisma/client.js';

// A nullable JSON column takes `DbNull` rather than `null`; keep that spelling
// out of the callers, who deal in plain values.
/**
 * A unique constraint failed (P2002) — on `column` when given. Depending on
 * the driver adapter, `meta` names the index or the fields, so both match.
 */
export function isUniqueViolation(error: unknown, column?: string): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false;
  }
  if (column === undefined) {
    return true;
  }
  const meta = JSON.stringify(error.meta ?? {});
  const camel = column.replace(/_(\w)/g, (_, c: string) => c.toUpperCase());

  return meta.includes(column) || meta.includes(camel);
}

export function dbNullable<T>(value: T | null | undefined) {
  return value === null ? Prisma.DbNull : value;
}
