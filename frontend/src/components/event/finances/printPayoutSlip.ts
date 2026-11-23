import type {
  PayoutBankAccount,
  PayoutDirection,
  PayoutStatementContent,
} from '@camp-registration/common/entities';
import { openPrintIframe } from '@/utils/printIframe';

/**
 * The frozen statement as is, plus what may change after it was made: when
 * the money moved, the note and the signature.
 */
export interface PrintPayoutSlipPayload extends PayoutStatementContent {
  label: string;
  direction: PayoutDirection;
  /** Formatted; `null` while the transfer is still to be made. */
  paidOn: string | null;
  /** Who recorded the payout: the audit trail on paper. */
  createdByName: string | null;
  recipientName: string;
  note: string | null;
  /** IBAN grouped for print; empty lines to fill in on an `OUT` slip without. */
  bankAccount: PayoutBankAccount | null;
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
