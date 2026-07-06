import { z, type ZodType } from 'zod';

export const PasswordSchema = z.string().min(8).max(72);

// eslint-disable-next-line security/detect-unsafe-regex
export const LocaleSchema = z.string().regex(/^[a-z]{2}(?:[_-][A-Z]{2})?$/);

export const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((value) => {
    const [yearString, monthString, dayString] = value.split('-');
    const year = Number(yearString);
    const month = Number(monthString);
    const day = Number(dayString);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, 'Date must be a valid calendar date');

export const TimeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/);

export const translatedValue = <T extends ZodType>(valueSchema: T) => {
  return z.union([z.record(z.string(), valueSchema), valueSchema]);
};
