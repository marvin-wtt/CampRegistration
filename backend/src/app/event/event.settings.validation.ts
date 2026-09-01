import { z } from 'zod';
import type { NavigationSettings } from '@camp-registration/common/settings';

export const NavigationSettingsValidation = z.object({
  hiddenItems: z.array(z.string()),
}) satisfies z.ZodType<NavigationSettings>;
