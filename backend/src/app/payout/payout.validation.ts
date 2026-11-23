import { z, type ZodType } from 'zod';
import { DateSchema } from '#core/validation/helper';
import { RECORD_VIEWS } from '@camp-registration/common/permissions';
import { FINANCE_AMOUNT } from '#app/expense/expense.validation';
import {
  isValidBic,
  isValidIban,
  normalizeBic,
  normalizeIban,
} from '@camp-registration/common/utils';
import type {
  PayoutBankAccount,
  PayoutCreateData,
  PayoutSignatureData,
  PayoutUpdateData,
} from '@camp-registration/common/entities';

const eventParams = z.object({ eventId: z.ulid() });
const payoutParams = z.object({ eventId: z.ulid(), payoutId: z.ulid() });

const fields = {
  recipientUserId: z.ulid().nullable(),
  recipientName: z.string().trim().max(255).nullable(),
  direction: z.enum(['OUT', 'IN']),
  amount: FINANCE_AMOUNT,
  // Empty while the payout is agreed but not made yet.
  paidOn: DateSchema.nullable(),
  note: z.string().trim().max(255).nullable(),
  // All or nothing; `null` clears them.
  bankAccount: z
    .object({
      holder: z.string().trim().min(1).max(255),
      iban: z
        .string()
        .transform(normalizeIban)
        .refine(isValidIban, { message: 'Invalid IBAN' }),
      bic: z
        .string()
        .transform(normalizeBic)
        .pipe(
          z.union([
            z.literal(''),
            z.string().refine(isValidBic, { message: 'Invalid BIC' }),
          ]),
        )
        .transform((bic) => bic || null)
        .nullable()
        .default(null),
    })
    .nullable() satisfies ZodType<PayoutBankAccount | null>,
};

const index = z.object({
  params: eventParams,
  query: z.object({ view: z.enum(RECORD_VIEWS).default('own') }),
});

const store = z.object({
  params: eventParams,
  body: z.object({
    recipientUserId: fields.recipientUserId.optional(),
    recipientName: fields.recipientName.optional(),
    direction: fields.direction,
    amount: fields.amount,
    paidOn: fields.paidOn.optional(),
    note: fields.note.optional(),
    bankAccount: fields.bankAccount.optional(),
  }) satisfies ZodType<PayoutCreateData>,
});

// Strict: amount, direction and recipient are frozen in the statement, and
// silently dropping a change to them would look like it was saved.
const update = z.object({
  params: payoutParams,
  body: z
    .object({
      paidOn: fields.paidOn.optional(),
      note: fields.note.optional(),
      bankAccount: fields.bankAccount.optional(),
      fileIds: z.array(z.ulid()).max(10).optional(),
    })
    .strict() satisfies ZodType<PayoutUpdateData>,
});

const destroy = z.object({ params: payoutParams });

const sign = z.object({
  params: payoutParams,
  body: z.object({
    // SVG path commands and numbers only: it is drawn, never parsed as markup.
    signature: z
      .string()
      .min(1)
      .max(100_000)
      .regex(/^[MLQCZmlqcz0-9 .,-]+$/),
    bankAccount: fields.bankAccount.optional(),
  }) satisfies ZodType<PayoutSignatureData>,
});

const unsign = z.object({ params: payoutParams });

export default { index, store, update, destroy, sign, unsign };
