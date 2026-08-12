import { z, type ZodType } from 'zod';
import type {
  TotpSetupData,
  TotpEnableData,
  TotpDisableData,
  TotpRecoveryCodesGenerateData,
} from '@camp-registration/common/entities';

const setup = z.object({
  body: z.object({
    password: z.string(),
  }) satisfies ZodType<TotpSetupData>,
});

const enable = z.object({
  body: z.object({
    otp: z.string().length(6),
  }) satisfies ZodType<TotpEnableData>,
});

const disable = z.object({
  body: z.object({
    password: z.string(),
    // Either a 6-digit TOTP or a longer recovery code.
    otp: z.string().min(6),
  }) satisfies ZodType<TotpDisableData>,
});

const generateRecoveryCodes = z.object({
  body: z.object({
    password: z.string(),
    // Either a 6-digit TOTP or a longer recovery code.
    otp: z.string().min(6),
  }) satisfies ZodType<TotpRecoveryCodesGenerateData>,
});

export default { setup, enable, disable, generateRecoveryCodes };
