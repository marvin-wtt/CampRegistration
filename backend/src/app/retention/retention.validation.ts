import { z, type ZodType } from 'zod';
import {
  RETENTION_DEADLINE_KINDS,
  type RetentionPostponeData,
} from '@camp-registration/common/privacy';

const event = z.object({ eventId: z.ulid() });

const show = z.object({ params: event });

const postpone = z.object({
  params: event.extend({ kind: z.enum(RETENTION_DEADLINE_KINDS) }),
  body: z.object({
    reason: z.string().trim().min(1).max(2000),
    until: z.iso.date(),
  }) satisfies ZodType<RetentionPostponeData>,
});

// Irreversible: the request has to say so, not only the dialog.
const purge = z.object({
  params: event,
  body: z.object({ confirm: z.literal(true) }),
});

const organization = z.object({
  params: z.object({ organizationId: z.ulid() }),
});

export default { show, postpone, purge, organization };
