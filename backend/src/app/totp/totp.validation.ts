import { z } from 'zod';

const setup = z.object({
  body: z.object({
    password: z.string(),
  }),
});

const enable = z.object({
  body: z.object({
    otp: z.string(),
  }),
});

const disable = z.object({
  body: z.object({
    password: z.string(),
    otp: z.string(),
  }),
});

export default { setup, enable, disable };
