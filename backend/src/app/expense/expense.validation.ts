import { z, type ZodType } from 'zod';
import { DateSchema } from '#core/validation/helper';
import { RECORD_VIEWS } from '@camp-registration/common/permissions';
import type {
  ExpenseCreateData,
  ExpenseQuery,
  ExpenseUpdateData,
} from '@camp-registration/common/entities';

/** Minor units; one million in a two-decimal currency is plenty for a receipt. */
export const FINANCE_AMOUNT = z.number().int().min(1).max(100_000_000);
const CURRENCY = z.string().regex(/^[A-Z]{3}$/, 'An ISO 4217 code, e.g. PLN');
const NAME = z.string().trim().max(255);
const FILE_IDS = z.array(z.ulid()).max(20);

const eventParams = z.object({ eventId: z.ulid() });
const expenseParams = z.object({ eventId: z.ulid(), expenseId: z.ulid() });

const fields = {
  type: z.enum(['EXPENSE', 'REFUND']),
  amount: FINANCE_AMOUNT,
  originalAmount: FINANCE_AMOUNT.nullable(),
  originalCurrency: CURRENCY.nullable(),
  // Empty while the receipt is still to come.
  date: DateSchema.nullable(),
  description: z.string().trim().min(1).max(255),
  categoryId: z.ulid().nullable(),
  paidByUserId: z.ulid().nullable(),
  paidByName: NAME.nullable(),
  fileIds: FILE_IDS,
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

const index = z.object({
  params: eventParams,
  query: z.object({
    view: z.enum(RECORD_VIEWS).default('own'),
    categoryId: z.ulid().optional(),
    paidByUserId: z.ulid().optional(),
    paidByName: z.string().max(255).optional(),
    missingFile: z.stringbool().optional(),
  }) satisfies ZodType<ExpenseQuery>,
});

const show = z.object({ params: expenseParams });

const store = z.object({
  params: eventParams,
  body: z
    .object({
      type: fields.type.optional(),
      amount: fields.amount,
      originalAmount: fields.originalAmount.optional(),
      originalCurrency: fields.originalCurrency.optional(),
      date: fields.date.optional(),
      description: fields.description,
      categoryId: fields.categoryId.optional(),
      paidByUserId: fields.paidByUserId.optional(),
      paidByName: fields.paidByName.optional(),
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
    }) satisfies ZodType<ExpenseCreateData>,
});

const update = z.object({
  params: expenseParams,
  body: z
    .object(fields)
    .partial()
    .superRefine(originalTogether) satisfies ZodType<ExpenseUpdateData>,
});

const destroy = z.object({ params: expenseParams });

export default { index, show, store, update, destroy };
