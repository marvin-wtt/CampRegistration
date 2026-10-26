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
  PAYMENT_RECORD_RETENTION_YEARS: z.coerce
    .number()
    .int()
    .min(1)
    .max(30)
    .default(10)
    .describe(
      'Years the payer name of a payment whose registration was deleted is ' +
        'kept for accounting (Germany: HGB § 257, AO § 147 — up to 10). ' +
        'Afterwards only the anonymous amounts remain.',
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
