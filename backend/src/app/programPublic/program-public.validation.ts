import { z } from 'zod';
import type { ProgramPublicSettings } from '@camp-registration/common/settings';
import { DateSchema } from '#core/validation/helper';

export const ProgramPublicSettingsValidation = z.object({
  enabled: z.boolean(),
  publishedDays: z.record(DateSchema, z.enum(['a', 'b', 'both'])),
}) satisfies z.ZodType<ProgramPublicSettings>;

export const show = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
  query: z.object({
    // The day to show; defaults (in the service) to today if the event is
    // currently running, otherwise its first day. Client-supplied, so it's
    // clamped to the event's own dates in the service rather than trusted.
    date: DateSchema.optional(),
  }),
});

export default {
  show,
};
