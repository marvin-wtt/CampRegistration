import { z } from 'zod';

const show = z.object({
  params: z.object({
    campId: z.string(),
    expenseId: z.string(),
  }),
});

const index = z.object({
  params: z.object({
    campId: z.string(),
  }),
  query: z.object({
    exportType: z.enum(['csv', 'excel-fgyp']).optional(),
  }),
});

const store = z.object({
  params: z.object({
    campId: z.string(),
  }),
  body: z.object({
    name: z.string(),
    description: z.string().optional(),
    amount: z.coerce.number().multipleOf(0.01),
    date: z.coerce.date(),
    category: z.string(),
    paidAt: z.coerce.date().optional(),
    paidBy: z.string().optional(),
    payee: z.string().optional(),
  }),
});

const update = z.object({
  params: z.object({
    campId: z.string(),
    expenseId: z.string(),
  }),
  body: z
    .object({
      name: z.string(),
      receiptNumber: z.coerce.number().int().nonnegative().nullable(),
      description: z.string().nullable(),
      amount: z.coerce
        .number()
        .multipleOf(0.01)
        .refine((val) => val !== 0),
      date: z.coerce.date(),
      category: z.string(),
      paidAt: z.coerce.date().nullable(),
      paidBy: z.string().nullable(),
      payee: z.string().nullable(),
      file: z.null(),
    })
    .partial()
    .superRefine((val, ctx) => {
      if (val.paidAt === null && val.paidBy !== null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Paid at must not be null',
        });
      }

      if (val.paidAt !== null && val.paidBy === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Paid by must not be null',
        });
      }
    }),
});

const destroy = z.object({
  params: z.object({
    campId: z.string(),
    expenseId: z.string(),
  }),
});

export default {
  show,
  index,
  store,
  update,
  destroy,
};
