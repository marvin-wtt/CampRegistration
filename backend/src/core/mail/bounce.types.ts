export interface BounceResult {
  /**
   * Correlates back to `MessageDelivery.bounceCorrelationId` — the outgoing
   * mail's Message-ID, echoed back verbatim by every bounce source: as
   * Original-Envelope-Id by an IMAP DSN report (RFC 3464 §2.3.1), and as
   * CustomID by a Mailjet webhook event.
   */
  correlationId: string;
  action: 'failed';
}

/**
 * Consumes one batch of bounces, regardless of source (IMAP poll or webhook).
 * Registered once via `MailService.onBounce()`.
 */
export type BounceHandler = (results: BounceResult[]) => Promise<void>;
