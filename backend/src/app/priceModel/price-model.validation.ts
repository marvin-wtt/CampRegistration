import { z, type ZodType } from 'zod';
import { translatedValue } from '#core/validation/helper';
import { PRICE_MODEL_CURRENCIES } from '@camp-registration/common/entities';
import type {
  OrganizationPriceModelAssignmentData,
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

const index = z.object({});

const store = z.object({
  body: z.object(priceModelBody) satisfies ZodType<PriceModelCreateData>,
});

const update = z.object({
  params: priceModelParams,
  body: z
    .object({
      ...priceModelBody,
      archived: z.boolean(),
    })
    .partial() satisfies ZodType<PriceModelUpdateData>,
});

const makeDefault = z.object({
  params: priceModelParams,
});

const destroy = z.object({
  params: priceModelParams,
});

const assignToOrganization = z.object({
  params: z.object({
    organizationId: z.ulid(),
  }),
  body: z.object({
    priceModelId: z.ulid(),
    applyToUpcomingEvents: z.boolean().optional(),
  }) satisfies ZodType<OrganizationPriceModelAssignmentData>,
});

const assignToEvent = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
  body: z.object({
    priceModelId: z.ulid(),
  }) satisfies ZodType<PriceModelAssignmentData>,
});

export default {
  index,
  store,
  update,
  makeDefault,
  destroy,
  assignToOrganization,
  assignToEvent,
};
