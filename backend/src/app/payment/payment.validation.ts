import { z, type ZodType } from 'zod';
import { DateSchema } from '#core/validation/helper';
import { MAX_AMOUNT_DUE } from '#app/registration/registration.price-check';
import { FINANCE_AMOUNT } from '#app/expense/expense.validation';
import {
  PAYMENT_METHODS,
  type AmountDueUpdateData,
  type PaymentCreateData,
  type PaymentRefundCreateData,
  type PaymentUpdateData,
} from '@camp-registration/common/entities';

// Blank means none, like a cleared input.
const NOTE = z
  .string()
  .trim()
  .max(255)
  .nullable()
  .transform((value) => (value === '' ? null : value));

const eventParams = z.object({ eventId: z.ulid() });
const registrationParams = z.object({
  eventId: z.ulid(),
  registrationFeeId: z.ulid(),
});
const paymentParams = z.object({ eventId: z.ulid(), paymentId: z.ulid() });

const index = z.object({ params: eventParams });

const showRegistration = z.object({ params: registrationParams });

const store = z.object({
  params: registrationParams,
  body: z.object({
    amount: FINANCE_AMOUNT,
    method: z.enum(PAYMENT_METHODS),
    paidOn: DateSchema,
    note: NOTE.optional(),
  }) satisfies ZodType<PaymentCreateData>,
});

const updateAmountDue = z.object({
  params: registrationParams,
  body: z.object({
    amount: z.number().int().min(0).max(MAX_AMOUNT_DUE).nullable(),
    note: NOTE.optional(),
  }) satisfies ZodType<AmountDueUpdateData>,
});

const update = z.object({
  params: paymentParams,
  body: z
    .object({ paidOn: DateSchema, note: NOTE })
    .partial() satisfies ZodType<PaymentUpdateData>,
});

const destroy = z.object({ params: paymentParams });

const refund = z.object({
  params: paymentParams,
  body: z.object({
    amount: FINANCE_AMOUNT,
    refundedOn: DateSchema,
    reason: NOTE.optional(),
    reduceAmountDue: z.boolean().optional(),
  }) satisfies ZodType<PaymentRefundCreateData>,
});

const destroyRefund = z.object({
  params: paymentParams.extend({ refundId: z.ulid() }),
});

export default {
  index,
  showRegistration,
  store,
  updateAmountDue,
  update,
  destroy,
  refund,
  destroyRefund,
};
