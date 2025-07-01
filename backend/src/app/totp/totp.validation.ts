import { z } from 'zod/v4';

const setup = z.object({
  body: z.object({
    password: z.string(),
  }),
});

const enable = z.object({
  body: z.object({
    otp: z.string().length(6),
  }),
});

const disable = z.object({
  body: z.object({
    password: z.string(),
    otp: z.string().length(6),
  }),
});

export default { setup, enable, disable };
