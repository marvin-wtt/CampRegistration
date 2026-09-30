import { z, type ZodType } from 'zod';
import { translatedValue } from '#core/validation/helper';
import { PRICE_MODEL_CURRENCIES } from '@camp-registration/common/entities';
import type {
  EventBillCreateData,
  EventBillQuery,
  EventBillUpdateData,
  PriceModelAssignmentData,
  PriceModelCreateData,
  PriceModelUpdateData,
} from '@camp-registration/common/entities';

const amount = z.number().nonnegative().multipleOf(0.01).max(99_999_999.99);

const priceModelBody = {
  name: translatedValue(z.string().trim().min(1).max(255)),
  currency: z.enum(PRICE_MODEL_CURRENCIES).optional(),
  pricePerRegistration: amount,
  baseFee: amount.optional(),
  taxRate: z.number().min(0).max(100).multipleOf(0.01).optional(),
};

const priceModelParams = z.object({
  priceModelId: z.ulid(),
});

const priceModelIndex = z.object({});

const priceModelStore = z.object({
  body: z.object(priceModelBody) satisfies ZodType<PriceModelCreateData>,
});

const priceModelUpdate = z.object({
  params: priceModelParams,
  body: z
    .object({
      ...priceModelBody,
      archived: z.boolean(),
    })
    .partial() satisfies ZodType<PriceModelUpdateData>,
});

const priceModelDefault = z.object({
  params: priceModelParams,
});

const priceModelDestroy = z.object({
  params: priceModelParams,
});

const organizationPriceModel = z.object({
  params: z.object({
    organizationId: z.ulid(),
  }),
  body: z.object({
    priceModelId: z.ulid(),
  }) satisfies ZodType<PriceModelAssignmentData>,
});

const eventPriceModel = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
  body: z.object({
    priceModelId: z.ulid().nullable(),
  }) satisfies ZodType<PriceModelAssignmentData>,
});

const registrationCount = z.number().int().nonnegative().max(100_000);

const billStatus = z.enum(['DRAFT', 'OPEN', 'PAID', 'VOID']);

const billIndex = z.object({
  query: z
    .object({
      cursor: z.ulid(),
      limit: z.coerce.number().int().positive().max(100),
      status: billStatus,
      organizationId: z.ulid(),
      search: z.string().max(255),
    })
    .partial()
    .optional() satisfies ZodType<EventBillQuery | undefined>,
});

const billUpdate = z.object({
  params: z.object({
    eventBillId: z.ulid(),
  }),
  body: z
    .object({
      status: z.enum(['PAID', 'VOID']),
      note: z.string().max(5000).nullable(),
      adjustedRegistrationCount: registrationCount.nullable(),
    })
    .partial() satisfies ZodType<EventBillUpdateData>,
});

const billStore = z.object({
  body: z
    .object({
      eventId: z.ulid().optional(),
      replacesBillId: z.ulid().optional(),
      priceModelId: z.ulid().optional(),
      adjustedRegistrationCount: registrationCount.optional(),
      note: z.string().max(5000).nullable().optional(),
    })
    .refine(
      (body) =>
        (body.eventId === undefined) !== (body.replacesBillId === undefined),
      { message: 'Pass exactly one of eventId and replacesBillId' },
    ) as unknown as ZodType<EventBillCreateData>,
});

const organizationBilling = z.object({
  params: z.object({
    organizationId: z.ulid(),
  }),
});

export default {
  priceModelIndex,
  priceModelStore,
  priceModelUpdate,
  priceModelDefault,
  priceModelDestroy,
  organizationPriceModel,
  eventPriceModel,
  billIndex,
  billUpdate,
  billStore,
  organizationBilling,
};
