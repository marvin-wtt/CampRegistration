import { z } from 'zod';

const paramsSchema = z.object({
  params: z.object({
    campId: z.ulid(),
    key: z.string(),
  }),
});

export function validateBody(schema: z.ZodType) {
  return paramsSchema.extend({
    body: z.object({ data: schema }),
  });
}

export default {
  show: paramsSchema,
  update: paramsSchema,
};
