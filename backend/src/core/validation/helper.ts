import { z, type ZodType } from 'zod';

export const PasswordSchema = z.string().min(8).max(26);

// eslint-disable-next-line security/detect-unsafe-regex
export const LocaleSchema = z.string().regex(/^[a-z]{2}(?:[_-][A-Z]{2})?$/);

export const translatedValue = <T extends ZodType>(valueSchema: T) => {
  return z.union([z.record(z.string(), valueSchema), valueSchema]);
};
