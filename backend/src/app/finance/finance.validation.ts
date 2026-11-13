import { z, type ZodType } from 'zod';
import type { FinanceSettingsUpdateData } from '@camp-registration/common/entities';
import { RECORD_VIEWS } from '@camp-registration/common/permissions';

const eventParams = z.object({ eventId: z.ulid() });

const balances = z.object({
  params: eventParams,
  query: z.object({ view: z.enum(RECORD_VIEWS).default('own') }),
});
const summary = z.object({ params: eventParams });
const parties = z.object({ params: eventParams });
const exportData = z.object({
  params: eventParams,
  query: z.object({ format: z.enum(['xlsx', 'csv']).default('xlsx') }),
});
const receipts = z.object({ params: eventParams });
const showSettings = z.object({ params: eventParams });

const updateSettings = z.object({
  params: eventParams,
  body: z.object({
    // Written by hand on paper slips: short, no spaces. Empty means bare numbers.
    payoutNumberPrefix: z
      .string()
      .regex(/^[\p{L}\p{N}-]{0,8}$/u, 'Up to 8 letters, digits or dashes')
      .optional(),
  }) satisfies ZodType<FinanceSettingsUpdateData>,
});

export default {
  balances,
  summary,
  parties,
  exportData,
  receipts,
  showSettings,
  updateSettings,
};
