import { z } from 'zod';
import type {
  NavigationSettings,
  OnboardingSettings,
} from '@camp-registration/common/settings';

export const NavigationSettingsValidation = z.object({
  hiddenItems: z.array(z.string()),
}) satisfies z.ZodType<NavigationSettings>;

export const OnboardingSettingsValidation = z.object({
  completed: z.array(z.string()),
  skipped: z.array(z.string()),
  hidden: z.boolean(),
}) satisfies z.ZodType<OnboardingSettings>;
