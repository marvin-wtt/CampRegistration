import { inject, injectable } from 'inversify';
import { RealtimeService } from '#core/realtime/RealtimeService';
import type { PaymentSyncOutcome } from './payment.service.js';
import { PaymentReceivedMessage } from './messages/received.mail.js';
import { PaymentFailedMessage } from './messages/failed.mail.js';
import { PaymentRefundedMessage } from './messages/refunded.mail.js';

/**
 * Turns a ledger change into its side effects: participant mail and realtime
 * invalidation. The one place outside a controller that emits realtime —
 * provider syncs also run from the queue worker, which has no controller to
 * hand the outcome back to — so `PaymentService` itself stays side-effect free.
 */
@injectable()
export class PaymentNotifier {
  constructor(
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {}

  async notify(outcome: PaymentSyncOutcome | null): Promise<void> {
    if (!outcome?.changed) {
      return;
    }

    const { event, registration, payment, statusChange, completedRefunds } =
      outcome;

    if (registration) {
      if (statusChange === 'PAID') {
        await PaymentReceivedMessage.enqueueFor(event, registration);
      } else if (statusChange === 'FAILED') {
        await PaymentFailedMessage.enqueueFor(event, registration);
      }

      for (const refund of completedRefunds) {
        if (refund.notifyParticipant) {
          await PaymentRefundedMessage.enqueueForRefund(
            event,
            registration,
            refund,
          );
        }
      }
    }

    this.emit(event.id, payment.id, registration?.id ?? null);
  }

  emit(
    eventId: string,
    paymentId: string,
    registrationId: string | null,
    operation: 'created' | 'updated' | 'deleted' = 'updated',
  ): void {
    void this.realtimeService.emit(eventId, 'payment', paymentId, operation);
    if (registrationId) {
      void this.realtimeService.emit(
        eventId,
        'registration',
        registrationId,
        'updated',
      );
    }
  }
}
