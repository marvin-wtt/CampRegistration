import type { MessageDelivery } from '#generated/prisma/client.js';
import { resolve } from '#core/ioc/container';
import { RegistrationService } from '#app/registration/registration.service';
import { EventService } from '#app/event/event.service';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { MessageBouncedNotification } from '#app/messageDelivery/message-bounced.mail';
import { MessageDeliveryService } from '#app/messageDelivery/message-delivery.service';
import type { BounceAction, BounceResult } from '#core/mail/bounce.reader';
import logger from '#core/logger';

const REASON_BY_ACTION: Record<BounceAction, string> = {
  failed: 'Rejected by the recipient server',
  delayed: 'Delivery delayed by the recipient server',
};

/**
 * Marks and reacts to a batch of bounces, one shared path for both detection
 * mechanisms: a synchronous SMTP rejection is just as much a `BounceResult`
 * as an async DSN report, it's simply produced locally (by
 * `RegistrationTemplateMessage.afterSend`, from `SendMailResult.rejected`)
 * instead of by `BounceReader.pollOnce()` — same shape, same handling.
 * `markBouncedByCorrelationId` makes finding a delivery idempotent, so
 * processing the same correlation id twice (e.g. a synchronous rejection
 * later echoed by a DSN report anyway) is harmless.
 */
export async function processBounceResults(
  results: BounceResult[],
): Promise<void> {
  for (const { correlationId, action } of results) {
    const delivery = await resolve(
      MessageDeliveryService,
    ).markBouncedByCorrelationId(correlationId, REASON_BY_ACTION[action]);

    if (delivery) {
      await notifyMessageBounced(delivery);
    }
  }
}

/**
 * Reacts to a newly-bounced delivery: pushes the realtime update the
 * messaging UI live-refreshes on, and emails the event's contact address.
 *
 * Called only from `processBounceResults` above, which isn't a controller
 * but is triggered by an external event (a send completing, a timer firing)
 * rather than being a plain domain service invoked from arbitrary call
 * sites — the same "edge" role a controller plays for a request, which is
 * why this reaches `RealtimeService` directly instead of routing through
 * `MessageDeliveryService` (which stays realtime-free per convention).
 *
 * Best-effort: swallows and logs its own errors so a notification failure
 * never surfaces as if marking the bounce itself had failed.
 */
async function notifyMessageBounced(delivery: MessageDelivery): Promise<void> {
  try {
    const registration = await resolve(
      RegistrationService,
    ).getRegistrationWithEventById(delivery.registrationId);
    if (!registration) {
      return;
    }

    const event = await resolve(EventService).getEventById(
      registration.eventId,
    );
    if (!event) {
      return;
    }

    void resolve(RealtimeService).emit(
      event.id,
      'message_delivery',
      delivery.id,
      'updated',
    );

    await MessageBouncedNotification.send({ event, registration, delivery });
  } catch (error) {
    logger.warn(
      `Failed to notify about bounced message delivery ${delivery.id}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
