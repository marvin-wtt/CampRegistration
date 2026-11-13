import type { Identifiable } from './Identifiable.js';
import type { Ownable } from './Ownable.js';
import type { Timestamps } from './Timestamps.js';

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
  createdByUserId: string | null;
  /** Who recorded it, for the slip; `null` once the account is gone. */
  createdByName: string | null;
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

export type PayoutUpdateData = Partial<PayoutCreateData>;
