import { z } from 'zod';

const setup = z.object({
  body: z.object({
    password: z.string(),
  }),
});

const enable = z.object({
  body: z.object({
    totp: z.string(),
  }),
});

const disable = z.object({
  body: z.object({
    password: z.string(),
    totp: z.string(),
  }),
});

export default { setup, enable, disable };
