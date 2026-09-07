import { z } from 'zod';
import { LocaleSchema } from '#core/validation/helper';

const translate = z.object({
  body: z.object({
    text: z.string().trim().min(1),
    targetLocales: z.array(LocaleSchema).min(1),
    sourceLocale: LocaleSchema.optional(),
  }),
});

export default { translate };
