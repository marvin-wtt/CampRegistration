import { z, type ZodType } from 'zod';
import {
  AUDIT_ENTITY_TYPES,
  type AuditLogQuery,
} from '@camp-registration/common/entities';

// `?entityType=event,message` / `?actorId=id1,id2`. A repeated parameter is
// accepted too, but comma form is the documented one: Express 5's default
// query parser does not decode the `entityType[]=` shape an array serializer
// would produce (see `event.validation.ts`).
const index = z.object({
  query: z
    .object({
      entityType: z
        .union([z.string(), z.array(z.string())])
        .transform((value) =>
          (Array.isArray(value) ? value : value.split(',')).map((v) =>
            v.trim(),
          ),
        )
        .pipe(
          z
            .array(z.enum(AUDIT_ENTITY_TYPES))
            .nonempty(),
        ),
      entityId: z.ulid(),
      actorId: z
        .union([z.string(), z.array(z.string())])
        .transform((value) =>
          (Array.isArray(value) ? value : value.split(',')).map((v) =>
            v.trim(),
          ),
        )
        .pipe(z.array(z.ulid()).nonempty()),
      hideSystem: z.stringbool(),
      from: z.iso.datetime(),
      to: z.iso.datetime(),
      cursor: z.ulid(),
      limit: z.coerce.number().int().positive().max(100),
    })
    .partial()
    .optional() satisfies ZodType<AuditLogQuery | undefined>,
});

export default {
  index,
};
