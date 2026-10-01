import { z, type ZodType } from 'zod';
import type {
  EventBillCreateData,
  EventBillQuery,
  EventBillUpdateData,
  InvoiceCreateData,
} from '@camp-registration/common/entities';

const registrationCount = z.number().int().nonnegative().max(100_000);

const billStatus = z.enum(['DRAFT', 'OPEN', 'PAID', 'VOID']);

const index = z.object({
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

const update = z.object({
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

const store = z.object({
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

const organization = z.object({
  params: z.object({
    organizationId: z.ulid(),
  }),
});

const event = z.object({
  params: z.object({
    eventId: z.ulid(),
  }),
});

const storeInvoice = z.object({
  params: z.object({
    eventBillId: z.ulid(),
  }),
  body: z.object({
    fileId: z.ulid(),
  }) satisfies ZodType<InvoiceCreateData>,
});

const destroyInvoice = z.object({
  params: z.object({
    eventBillId: z.ulid(),
    invoiceId: z.ulid(),
  }),
});

const showInvoice = destroyInvoice;

const organizationInvoice = z.object({
  params: z.object({
    organizationId: z.ulid(),
    invoiceId: z.ulid(),
  }),
});

const eventInvoice = z.object({
  params: z.object({
    eventId: z.ulid(),
    invoiceId: z.ulid(),
  }),
});

export default {
  index,
  update,
  store,
  organization,
  event,
  storeInvoice,
  destroyInvoice,
  showInvoice,
  organizationInvoice,
  eventInvoice,
};
