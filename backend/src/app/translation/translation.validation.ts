import { z } from 'zod';
import { LocaleSchema } from '#core/validation/helper';

const translate = z.object({
  body: z.object({
    text: z.string().trim().min(1),
    targetLocale: LocaleSchema,
    sourceLocale: LocaleSchema.optional(),
  }),
});

export default { translate };
