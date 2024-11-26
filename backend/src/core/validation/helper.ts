import { z, ZodType } from 'zod';

export const PasswordSchema = z.string().min(8).max(26);

export const BooleanStringSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (['1', 'true'].includes(val.toLowerCase())) return true;
    if (['0', 'false'].includes(val.toLowerCase())) return false;
  }
  return val;
}, z.coerce.boolean());

export const translatedValue = (valueSchema: ZodType = z.string()) => {
  return z.union([z.record(z.string(), valueSchema), valueSchema]);
};
