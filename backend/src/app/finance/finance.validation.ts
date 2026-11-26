import { z, type ZodType } from 'zod';
import type {
  FinancePartyLinkData,
  FinanceSettingsUpdateData,
} from '@camp-registration/common/entities';
import { RECORD_VIEWS } from '@camp-registration/common/permissions';

const eventParams = z.object({ eventId: z.ulid() });

const NUMBER_PREFIX = z
  .string()
  .regex(/^[\p{L}\p{N}-]{0,8}$/u, 'Up to 8 letters, digits or dashes');

const balances = z.object({
  params: eventParams,
  query: z.object({ view: z.enum(RECORD_VIEWS).default('own') }),
});
const summary = z.object({ params: eventParams });
const parties = z.object({ params: eventParams });
const linkParty = z.object({
  params: eventParams,
  body: z.object({
    name: z.string().trim().min(1).max(255),
    userId: z.ulid(),
  }) satisfies ZodType<FinancePartyLinkData>,
});
const exportData = z.object({
  params: eventParams,
  query: z.object({ format: z.enum(['xlsx', 'csv']).default('xlsx') }),
});
const receipts = z.object({
  params: eventParams,
  query: z.object({ folders: z.enum(['none', 'group']).default('none') }),
});
const showSettings = z.object({ params: eventParams });

const updateSettings = z.object({
  params: eventParams,
  body: z.object({
    // Written by hand on paper slips: short, no spaces. Empty means bare numbers.
    payoutNumberPrefix: NUMBER_PREFIX.optional(),
    incomeNumberPrefix: NUMBER_PREFIX.optional(),
  }) satisfies ZodType<FinanceSettingsUpdateData>,
});

export default {
  balances,
  summary,
  parties,
  linkParty,
  exportData,
  receipts,
  showSettings,
  updateSettings,
};
