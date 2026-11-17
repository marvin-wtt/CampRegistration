import { z } from 'zod';
import type { FinanceDisplaySettings } from '@camp-registration/common/settings';

export const FinanceDisplaySettingsValidation = z.object({
  flagMissingCategories: z.boolean(),
}) satisfies z.ZodType<FinanceDisplaySettings>;
