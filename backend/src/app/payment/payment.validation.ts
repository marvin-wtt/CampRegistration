import { z, type ZodType } from 'zod';
import type {
  PaymentAccountConnectData,
  PaymentCreateData,
  PaymentRefundCreateData,
} from '@camp-registration/common/entities';
import type { PaymentSettings } from '@camp-registration/common/settings';

export const PaymentSettingsValidation = z.object({
  enabled: z.boolean(),
  timing: z.enum(['REGISTRATION', 'ACCEPTANCE']),
  reminderAfterDays: z.number().int().min(1).max(365).nullable(),
}) satisfies z.ZodType<PaymentSettings>;

const eventParams = z.object({
  eventId: z.ulid(),
});

const registrationParams = eventParams.extend({
  registrationId: z.ulid(),
});

const paymentParams = registrationParams.extend({
  paymentId: z.ulid(),
});

const tokenQuery = z.object({
  token: z.string().min(1).max(128),
});

const eventIndex = z.object({
  params: eventParams,
});

const index = z.object({
  params: registrationParams,
});

const store = z.object({
  params: registrationParams,
  body: z.object({
    amount: z.number().positive().multipleOf(0.001),
    paidAt: z.iso.datetime({ offset: true }).optional(),
    method: z.string().trim().max(64).nullable().optional(),
    note: z.string().trim().max(2000).nullable().optional(),
  }) satisfies ZodType<PaymentCreateData>,
});

const destroy = z.object({
  params: paymentParams,
});

const refund = z.object({
  params: paymentParams,
  body: z.object({
    amount: z.number().int().positive(),
    reason: z.string().trim().max(500).nullable().optional(),
    suppressMessage: z.boolean().optional(),
  }) satisfies ZodType<PaymentRefundCreateData>,
});

const request = z.object({
  params: registrationParams,
});

const summary = z.object({
  params: registrationParams,
  query: tokenQuery,
});

const checkout = z.object({
  params: registrationParams,
  query: tokenQuery,
});

const connect = z.object({
  params: z.object({ organizationId: z.ulid() }),
  body: z.object({
    provider: z.enum(['mollie', 'stripe', 'fake']),
    apiKey: z.string().trim().min(1).max(255),
  }) satisfies ZodType<PaymentAccountConnectData>,
});

export default {
  eventIndex,
  index,
  store,
  destroy,
  refund,
  request,
  summary,
  checkout,
  connect,
};
