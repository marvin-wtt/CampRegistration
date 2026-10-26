import type { AuditRecordInput } from '#app/audit/audit.service';
import type { AuditValue } from '@camp-registration/common/entities';
import type { Registration } from '#generated/prisma/client';

export type PaymentAuditAction =
  | 'payment_recorded'
  | 'payment_deleted'
  | 'payment_refunded'
  | 'payment_requested'
  | 'payment_status_changed'
  | 'amount_due_adjusted'
  | 'amount_due_reset';

/**
 * Payment entries are filed on their registration, so they show in its
 * history. Amounts are minor units of the event currency; notes, reasons and
 * methods are free text and never recorded.
 */
export function paymentAuditEntry(
  registration: Pick<Registration, 'id' | 'eventId'>,
  action: PaymentAuditAction,
  values: Record<string, AuditValue> = {},
): AuditRecordInput {
  return {
    action,
    entityType: 'registration',
    entityId: registration.id,
    eventId: registration.eventId,
    details: Object.keys(values).length > 0 ? { values } : null,
  };
}
