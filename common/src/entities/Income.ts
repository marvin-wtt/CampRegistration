import type { Identifiable } from './Identifiable.js';
import type { ServiceFile } from './ServiceFile.js';
import type { Timestamps } from './Timestamps.js';

/**
 * Money the event receives other than registration fees — a grant, a
 * donation. Always shared funds. Amounts are minor units of the event's
 * currency.
 */
export interface Income extends Identifiable, Timestamps {
  number: number;
  /** The number with the event's prefix, as printed: `I3`. */
  label: string;
  amount: number;
  /** What the grant letter says when it is in another currency; set together. */
  originalAmount: number | null;
  originalCurrency: string | null;
  /** `YYYY-MM-DD` the money arrived; `null` while it is only promised. */
  receivedOn: string | null;
  description: string;
  /** Who gave it: a funder, a sponsor. */
  payerName: string | null;
  categoryId: string | null;
  createdByUserId: string | null;
  files: ServiceFile[];
}

export interface IncomeCreateData {
  amount: number;
  originalAmount?: number | null | undefined;
  originalCurrency?: string | null | undefined;
  receivedOn?: string | null | undefined;
  description: string;
  payerName?: string | null | undefined;
  categoryId?: string | null | undefined;
  /** Temporary uploads to attach: the grant letter, a donation receipt. */
  fileIds?: string[] | undefined;
}

export type IncomeUpdateData = Partial<IncomeCreateData>;
