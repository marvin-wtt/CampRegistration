import { z } from 'zod';
import { PasswordSchema } from '#core/validation/helper';

const register = z.object({
  body: z.object({
    name: z.string(),
    email: z.string().email(),
    password: PasswordSchema,
  }),
});

const login = z.object({
  body: z.object({
    email: z.string(),
    password: z.string(),
    remember: z.boolean().default(false),
  }),
});

const logout = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

const refreshTokens = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

const forgotPassword = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const resetPassword = z.object({
  body: z.object({
    token: z.string(),
    email: z.string().email(),
    password: PasswordSchema,
  }),
});

const verifyEmail = z.object({
  body: z.object({
    token: z.string(),
  }),
});

export default {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
