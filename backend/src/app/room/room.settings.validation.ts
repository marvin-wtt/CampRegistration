import { z } from 'zod';
import type { RoomPlannerSettings } from '@camp-registration/common/settings';

export const RoomSettingsValidation = z.object({
  skipGenderFilter: z.boolean(),
  skipRoleFilter: z.boolean(),
  sortBy: z.enum(['age', 'name']),
}) satisfies z.ZodType<RoomPlannerSettings>;
