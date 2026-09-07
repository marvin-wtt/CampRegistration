import { z } from 'zod';
import { LocaleSchema } from '#core/validation/helper';

const MAX_TEXT_LENGTH = 1000;
const MAX_TARGET_LOCALES = 10;

const translate = z.object({
  body: z.object({
    text: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
    targetLocales: z.array(LocaleSchema).min(1).max(MAX_TARGET_LOCALES),
    sourceLocale: LocaleSchema.optional(),
  }),
});

export default { translate };
