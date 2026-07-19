import { z, type ZodType } from 'zod';
import type { CampSettingUpdateData } from '@camp-registration/common/entities';

const paramsSchema = z.object({
  params: z.object({
    campId: z.ulid(),
    key: z.string(),
  }),
});

export function validateBody<T>(schema: ZodType<T>) {
  return paramsSchema.extend({
    body: z.object({ data: schema }) satisfies ZodType<
      CampSettingUpdateData<T>
    >,
  });
}

export default {
  show: paramsSchema,
  update: paramsSchema,
};
