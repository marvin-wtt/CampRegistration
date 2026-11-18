import { z, type ZodType } from 'zod';
import { translatedValue } from '#core/validation/helper';
import type {
  FinanceCategoryCreateData,
  FinanceCategoryOrderData,
  FinanceCategoryUpdateData,
} from '@camp-registration/common/entities';

const NAME = translatedValue(z.string().trim().min(1).max(100));
const POSITION = z.number().int().min(0).max(10_000);

const eventParams = z.object({ eventId: z.ulid() });
const categoryParams = z.object({
  eventId: z.ulid(),
  financeCategoryId: z.ulid(),
});

const KIND = z.enum(['EXPENSE', 'INCOME']);

// One kind's list at a time; the expense screens never see income ones.
const kindQuery = z.object({ kind: KIND.default('EXPENSE') });

const index = z.object({ params: eventParams, query: kindQuery });

const store = z.object({
  params: eventParams,
  body: z.object({
    kind: KIND.optional(),
    parentId: z.ulid().nullable().optional(),
    name: NAME,
    position: POSITION.optional(),
  }) satisfies ZodType<FinanceCategoryCreateData>,
});

const update = z.object({
  params: categoryParams,
  body: z.object({
    name: NAME.optional(),
    archived: z.boolean().optional(),
  }) satisfies ZodType<FinanceCategoryUpdateData>,
});

const order = z.object({
  params: eventParams,
  query: kindQuery,
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
  }) satisfies ZodType<FinanceCategoryOrderData>,
});

const destroy = z.object({ params: categoryParams });

export default { index, store, update, order, destroy };
