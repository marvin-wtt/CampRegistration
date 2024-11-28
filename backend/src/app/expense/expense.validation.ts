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
});

const store = z.object({
  params: z.object({
    campId: z.string(),
  }),
  body: z.object({
    name: z.string(),
    description: z.string().optional(),
    amount: z.number().multipleOf(0.01),
    date: z.date(),
    category: z.string().optional(),
    paidAt: z.date().optional(),
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
      receiptNumber: z.number().int().nonnegative(),
      description: z.string(),
      amount: z.number().multipleOf(0.01),
      date: z.date(),
      category: z.string(),
      paidAt: z.date(),
      paidBy: z.string(),
      payee: z.string(),
    })
    .partial(),
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
