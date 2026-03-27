import { z } from 'zod';

const index = z.object({
  params: z.object({
    newsletterId: z.ulid(),
  }),
});

const store = z.object({
  params: z.object({
    newsletterId: z.ulid(),
  }),
  body: z.object({
    email: z.email(),
  }),
});

const destroy = z.object({
  params: z.object({
    newsletterId: z.ulid(),
    newsletterManagerId: z.ulid(),
  }),
});

export default {
  index,
  store,
  destroy,
};
