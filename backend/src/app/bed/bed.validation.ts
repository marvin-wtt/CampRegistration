import { z, type ZodType } from 'zod';
import type { Bed } from '@camp-registration/common/entities';

const store = z.object({
  params: z.object({
    campId: z.ulid(),
    roomId: z.ulid(),
  }),
  body: z.object({
    registrationId: z.ulid().optional(),
  }) satisfies ZodType<Partial<Pick<Bed, 'registrationId'>>>,
});

const update = z.object({
  params: z.object({
    campId: z.ulid(),
    roomId: z.ulid(),
    bedId: z.ulid(),
  }),
  body: z.object({
    registrationId: z.ulid().nullable(),
  }) satisfies ZodType<Pick<Bed, 'registrationId'>>,
});

const destroy = z.object({
  params: z.object({
    campId: z.ulid(),
    roomId: z.ulid(),
    bedId: z.ulid(),
  }),
});

export default {
  store,
  update,
  destroy,
};
