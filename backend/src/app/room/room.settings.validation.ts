import { z } from 'zod';
import type { RoomPlannerSettings } from '@camp-registration/common/settings';

export const RoomSettingsValidation = z.object({
  skipGenderFilter: z.boolean(),
  skipRoleFilter: z.boolean(),
}) satisfies z.ZodType<RoomPlannerSettings>;
