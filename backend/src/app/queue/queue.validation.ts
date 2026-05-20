import { z } from 'zod';

const queueParams = z.object({
  params: z.object({
    queue: z.string().min(1),
  }),
});

const retryFailed = queueParams;
const deleteFailed = queueParams;

export default {
  retryFailed,
  deleteFailed,
};
