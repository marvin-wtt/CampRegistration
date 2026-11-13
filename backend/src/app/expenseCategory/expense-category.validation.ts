import { z, type ZodType } from 'zod';
import { translatedValue } from '#core/validation/helper';
import type {
  ExpenseCategoryCreateData,
  ExpenseCategoryOrderData,
  ExpenseCategoryUpdateData,
} from '@camp-registration/common/entities';

const NAME = translatedValue(z.string().trim().min(1).max(100));
const POSITION = z.number().int().min(0).max(10_000);

const eventParams = z.object({ eventId: z.ulid() });
const categoryParams = z.object({
  eventId: z.ulid(),
  expenseCategoryId: z.ulid(),
});

const index = z.object({ params: eventParams });

const store = z.object({
  params: eventParams,
  body: z.object({
    parentId: z.ulid().nullable().optional(),
    name: NAME,
    position: POSITION.optional(),
  }) satisfies ZodType<ExpenseCategoryCreateData>,
});

const update = z.object({
  params: categoryParams,
  body: z.object({
    name: NAME.optional(),
    archived: z.boolean().optional(),
  }) satisfies ZodType<ExpenseCategoryUpdateData>,
});

const order = z.object({
  params: eventParams,
  body: z.object({
    items: z
      .array(
        z.object({
          id: z.ulid(),
          parentId: z.ulid().nullable(),
          position: POSITION,
        }),
      )
      .max(500),
  }) satisfies ZodType<ExpenseCategoryOrderData>,
});

const destroy = z.object({ params: categoryParams });

export default { index, store, update, order, destroy };
