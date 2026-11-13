import type {
  PayoutDirection,
  Translatable,
} from '@camp-registration/common/entities';
import { openPrintIframe } from '@/utils/printIframe';

/** Everything on the slip, formatted by the opener in the reader's language. */
export interface PrintPayoutSlipPayload {
  eventName: Translatable;
  organizer: Translatable;
  label: string;
  direction: PayoutDirection;
  /** Formatted; `null` while the transfer is still to be made. */
  paidOn: string | null;
  /** Who recorded the payout, and when: the audit trail on paper. */
  createdByName: string | null;
  createdOn: string;
  recipientName: string;
  note: string | null;
  /** The recipient's receipts, each line ready to print. */
  expenses: {
    number: string;
    date: string;
    description: string;
    amount: string;
  }[];
  totals: { label: string; amount: string; strong?: boolean }[];
  /** What the recipient confirms; the same text they signed on screen. */
  declaration: string;
  /** SVG path data, drawn in `SIGNATURE_VIEWBOX`. */
  signature: string | null;
  signedAt: string | null;
}

/**
 * The reimbursement statement: the person's receipts, the balance, and their
 * declaration that the expenses really occurred, signed.
 */
export function printPayoutSlip(
  payload: PrintPayoutSlipPayload,
  onError: (error: string) => void,
): void {
  // A4 portrait at 96 dpi with 12mm margins.
  openPrintIframe('/print/payout-slip', {
    messagePrefix: 'PRINT_PAYOUT',
    payload,
    widthPx: 703,
    heightPx: 1032,
    onError,
  });
}
