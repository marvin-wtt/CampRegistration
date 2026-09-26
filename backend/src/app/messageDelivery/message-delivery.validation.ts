import { z } from 'zod';

const resend = z.object({
  params: z.object({
    eventId: z.ulid(),
    registrationId: z.ulid(),
    deliveryId: z.ulid(),
  }),
});

export default {
  resend,
};
