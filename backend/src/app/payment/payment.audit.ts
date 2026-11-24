import type { AuditRecordInput } from '#app/audit/audit.service';
import type { AuditValue } from '@camp-registration/common/entities';

export type PaymentAuditAction =
  | 'payment_recorded'
  | 'payment_updated'
  | 'payment_deleted'
  | 'payment_refunded'
  | 'payment_refund_deleted'
  | 'payment_settled'
  | 'amount_due_adjusted'
  | 'amount_due_reset';

/**
 * Payment entries are filed on their registration, so they show in its
 * history, and stay under its id once it is deleted. Amounts are minor units;
 * notes and reasons are free text and never recorded.
 */
export function paymentAuditEntry(
  registration: { registrationId: string; eventId: string },
  action: PaymentAuditAction,
  values: Record<string, AuditValue> = {},
): AuditRecordInput {
  return {
    action,
    entityType: 'registration',
    entityId: registration.registrationId,
    eventId: registration.eventId,
    details: Object.keys(values).length > 0 ? { values } : null,
  };
}
