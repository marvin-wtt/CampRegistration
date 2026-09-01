import { z, type ZodType } from 'zod';
import { PasswordSchema } from '#core/validation/helper';
import type { LoginData } from '@camp-registration/common/entities';

const register = z.object({
  body: z.object({
    name: z.string(),
    email: z.email(),
    password: PasswordSchema,
  }),
});

const login = z.object({
  body: z.object({
    email: z.email(),
    password: z.string(),
    remember: z.boolean().default(false),
  }) satisfies ZodType<LoginData>,
});

const verifyOTP = z.object({
  body: z.object({
    token: z.string(),
    otp: z.string(),
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
    email: z.email(),
  }),
});

const resetPassword = z.object({
  body: z.object({
    token: z.string(),
    email: z.email(),
    password: PasswordSchema,
  }),
});

const verifyEmail = z.object({
  body: z.object({
    token: z.string(),
  }),
});

const sendEmailVerification = z.object({
  body: z.object({
    token: z.string(),
  }),
});

export default {
  register,
  login,
  verifyOTP,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  sendEmailVerification,
};
