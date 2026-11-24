import { z, type ZodType } from 'zod';
import { DateSchema } from '#core/validation/helper';
import { FINANCE_AMOUNT } from '#app/expense/expense.validation';
import type {
  IncomeCreateData,
  IncomeUpdateData,
} from '@camp-registration/common/entities';

const CURRENCY = z.string().regex(/^[A-Z]{3}$/, 'An ISO 4217 code, e.g. PLN');

const eventParams = z.object({ eventId: z.ulid() });
const incomeParams = z.object({ eventId: z.ulid(), incomeId: z.ulid() });

const fields = {
  amount: FINANCE_AMOUNT,
  originalAmount: FINANCE_AMOUNT.nullable(),
  originalCurrency: CURRENCY.nullable(),
  // Empty while the money is promised but not paid yet.
  receivedOn: DateSchema.nullable(),
  description: z.string().trim().min(1).max(255),
  // Blank means none, like a cleared input.
  payerName: z
    .string()
    .trim()
    .max(255)
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  categoryId: z.ulid().nullable(),
  fileIds: z.array(z.ulid()).max(20),
};

/** The original amount and its currency only make sense together. */
function originalTogether(
  value: { originalAmount?: unknown; originalCurrency?: unknown },
  ctx: z.RefinementCtx,
) {
  const hasAmount = value.originalAmount != null;
  const hasCurrency = value.originalCurrency != null;
  if (
    value.originalAmount !== undefined &&
    value.originalCurrency !== undefined &&
    hasAmount !== hasCurrency
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'Original amount and currency are set together.',
      path: hasAmount ? ['originalCurrency'] : ['originalAmount'],
    });
  }
}

const index = z.object({ params: eventParams });
const show = z.object({ params: incomeParams });

const store = z.object({
  params: eventParams,
  body: z
    .object({
      amount: fields.amount,
      originalAmount: fields.originalAmount.optional(),
      originalCurrency: fields.originalCurrency.optional(),
      receivedOn: fields.receivedOn.optional(),
      description: fields.description,
      payerName: fields.payerName.optional(),
      categoryId: fields.categoryId.optional(),
      fileIds: fields.fileIds.optional(),
    })
    .superRefine((value, ctx) => {
      originalTogether(
        {
          originalAmount: value.originalAmount ?? null,
          originalCurrency: value.originalCurrency ?? null,
        },
        ctx,
      );
    }) satisfies ZodType<IncomeCreateData>,
});

const update = z.object({
  params: incomeParams,
  body: z
    .object(fields)
    .partial()
    .superRefine(originalTogether) satisfies ZodType<IncomeUpdateData>,
});

const destroy = z.object({ params: incomeParams });

export default { index, show, store, update, destroy };
