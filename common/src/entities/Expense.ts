import type { RecordView } from '#permissions';
import type { Identifiable } from './Identifiable.js';
import type { Ownable } from './Ownable.js';
import type { ServiceFile } from './ServiceFile.js';
import type { Timestamps } from './Timestamps.js';

/** A refund reduces its category's costs; `amount` is positive either way. */
export type ExpenseType = 'EXPENSE' | 'REFUND';

/**
 * Amounts are minor units of the event's currency. Neither `paidByUserId` nor
 * `paidByName` set means event funds paid (or, for a refund, received).
 */
export interface Expense extends Identifiable, Ownable, Timestamps {
  receiptNumber: number;
  type: ExpenseType;
  amount: number;
  /** What the receipt says when it is in another currency; set together. */
  originalAmount: number | null;
  originalCurrency: string | null;
  /** `YYYY-MM-DD` on the receipt; `null` while the receipt is still to come. */
  date: string | null;
  description: string;
  categoryId: string | null;
  paidByUserId: string | null;
  paidByName: string | null;
  createdByUserId: string | null;
  files: ServiceFile[];
}

export interface ExpenseCreateData {
  type?: ExpenseType | undefined;
  amount: number;
  originalAmount?: number | null | undefined;
  originalCurrency?: string | null | undefined;
  date?: string | null | undefined;
  description: string;
  categoryId?: string | null | undefined;
  paidByUserId?: string | null | undefined;
  /** Ignored when `paidByUserId` is set: the manager's name is snapshotted. */
  paidByName?: string | null | undefined;
  /** Temporary uploads to attach as receipt files. */
  fileIds?: string[] | undefined;
}

export type ExpenseUpdateData = Partial<ExpenseCreateData>;

export interface ExpenseQuery {
  view?: RecordView | undefined;
  categoryId?: string | undefined;
  paidByUserId?: string | undefined;
  paidByName?: string | undefined;
  missingFile?: boolean | undefined;
}
