import { z } from 'zod';

export const RoomSettingsValidation = z.object({
  skipGenderFilter: z.boolean(),
  skipRoleFilter: z.boolean(),
});
