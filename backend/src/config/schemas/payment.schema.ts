import { z } from 'zod';

export const PaymentEnvSchema = z.object({
  PAYMENT_LINK_SECRET: z
    .string()
    .min(32)
    .optional()
    .describe(
      'Secret that signs the payment links sent to participants. Rotating ' +
        'it invalidates every link already sent. Defaults to a key derived ' +
        'from JWT_SECRET.',
    ),
  PAYMENT_FAKE_PROVIDER: z
    .stringbool()
    .default(false)
    .describe(
      'Offer the "fake" payment provider, which settles payments without ' +
        'real money. Opt-in for development and e2e tests only — never set ' +
        'this on a real deployment.',
    ),
});

export type PaymentEnv = z.output<typeof PaymentEnvSchema>;
