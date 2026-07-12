import { z } from 'zod';

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
    // Either a 6-digit TOTP or a longer recovery code.
    otp: z.string().min(6),
  }),
});

const generateRecoveryCodes = z.object({
  body: z.object({
    password: z.string(),
    // Either a 6-digit TOTP or a longer recovery code.
    otp: z.string().min(6),
  }),
});

export default { setup, enable, disable, generateRecoveryCodes };
