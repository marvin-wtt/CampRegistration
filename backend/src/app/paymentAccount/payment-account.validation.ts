import { z, type ZodType } from 'zod';
import type { PaymentAccountConnectData } from '@camp-registration/common/entities';

const connect = z.object({
  params: z.object({ organizationId: z.ulid() }),
  body: z.object({
    provider: z.enum(['mollie', 'stripe', 'fake']),
    apiKey: z.string().trim().min(1).max(255),
  }) satisfies ZodType<PaymentAccountConnectData>,
});

export default {
  connect,
};
