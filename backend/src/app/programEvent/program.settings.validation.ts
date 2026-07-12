import { z } from 'zod';

export const ProgramSettingsValidation = z.object({
  dayStart: z.string(),
  dayEnd: z.string(),
  timeInterval: z.number(),
  showAllTranslations: z.boolean(),
});
