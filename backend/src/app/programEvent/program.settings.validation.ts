import { z } from 'zod';
import type { ProgramPlannerSettings } from '@camp-registration/common/settings';

export const ProgramSettingsValidation = z.object({
  dayStart: z.string(),
  dayEnd: z.string(),
  timeInterval: z.number(),
  showAllTranslations: z.boolean(),
  browseOutsideCampDates: z.boolean(),
}) satisfies z.ZodType<ProgramPlannerSettings>;
