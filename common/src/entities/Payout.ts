import type { Identifiable } from './Identifiable.js';
import type { Ownable } from './Ownable.js';
import type { Timestamps } from './Timestamps.js';
import type { ServiceFile } from './ServiceFile.js';
import type { Translatable } from './Translatable.js';

/** `OUT` pays a person from event funds; `IN` is money they hand back. */
export type PayoutDirection = 'OUT' | 'IN';

export interface Payout extends Identifiable, Ownable, Timestamps {
  number: number;
  /** `number` with the event's prefix, as written on the slip: `P3`. */
  label: string;
  recipientUserId: string | null;
  recipientName: string;
  direction: PayoutDirection;
  amount: number;
  /** `YYYY-MM-DD` the money moved; `null` while the payout is still to be made. */
  paidOn: string | null;
  note: string | null;
  /** The recipient's signature under the statement, as SVG path data. */
  signature: string | null;
  signedAt: string | null;
  /** Scans of the slip signed on paper; signed like `signature` is. */
  files: ServiceFile[];
  /** The slip as frozen at creation; printed as is, never rebuilt. */
  statement: PayoutStatementContent;
  /** The receipts the statement lists, e.g. to warn before editing one. */
  statementExpenseIds: string[];
  /** The last receipt number when frozen: later receipts aren't listed. */
  statementReceiptsUpTo: number;
  /** The data behind the statement changed since it was frozen. */
  outdated: boolean;
  createdByUserId: string | null;
  /** Who recorded it, for the slip; `null` once the account is gone. */
  createdByName: string | null;
}

/** One printed line of the statement: formatted, in the slip's language. */
export interface PayoutStatementLine {
  label: string;
  amount: string;
  strong?: boolean;
}

/** What the slip shows, formatted once in the creator's language. */
export interface PayoutStatementContent {
  locale: string;
  eventName: Translatable;
  organizer: Translatable;
  createdOn: string;
  expenses: {
    number: string;
    date: string;
    description: string;
    amount: string;
  }[];
  /** Ends with this payout, the line the slip highlights. */
  totals: PayoutStatementLine[];
  balanceAfter: PayoutStatementLine;
  declaration: string;
}

/** Drawn in a 600 × 200 box; see `SIGNATURE_VIEWBOX`. */
export interface PayoutSignatureData {
  signature: string;
}

export const SIGNATURE_VIEWBOX = { width: 600, height: 200 } as const;

export interface PayoutCreateData {
  recipientUserId?: string | null | undefined;
  /** Ignored when `recipientUserId` is set: the manager's name is snapshotted. */
  recipientName?: string | null | undefined;
  direction: PayoutDirection;
  amount: number;
  paidOn?: string | null | undefined;
  note?: string | null | undefined;
}

/** Amount, direction and recipient are frozen in the statement. */
export interface PayoutUpdateData {
  paidOn?: string | null | undefined;
  note?: string | null | undefined;
  /** Scans of the signed paper slip; temporary uploads to attach. */
  fileIds?: string[] | undefined;
}
