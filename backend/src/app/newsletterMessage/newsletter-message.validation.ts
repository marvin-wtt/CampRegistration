import { z } from 'zod';

const index = z.object({
  params: z.object({
    newsletterId: z.ulid(),
  }),
});

const destroy = z.object({
  params: z.object({
    newsletterId: z.ulid(),
    messageId: z.ulid(),
  }),
});

export default {
  index,
  destroy,
};
