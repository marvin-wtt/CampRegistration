import type { MessageDelivery } from '#generated/prisma/client.js';
import { resolve } from '#core/ioc/container';
import { RegistrationService } from '#app/registration/registration.service';
import { EventService } from '#app/event/event.service';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { MessageBouncedNotification } from '#app/messageDelivery/message-bounced.mail';
import { MessageDeliveryService } from '#app/messageDelivery/message-delivery.service';
import type { BounceResult } from '#core/mail/bounce.reader';
import logger from '#core/logger';
import { describeError } from '#utils/errors';

const FAILED_REASON = 'Rejected by the recipient server';

/**
 * Marks and reacts to a batch of bounces, one shared path for both detection
 * mechanisms: a synchronous SMTP rejection is just as much a `BounceResult`
 * as an async DSN report, it's simply produced locally (by
 * `RegistrationTemplateMessage.afterSend`, from `SendMailResult.rejected`)
 * instead of by `BounceReader.pollOnce()` — same shape, same handling.
 * `markBouncedByCorrelationId` makes finding a delivery idempotent, so
 * processing the same correlation id twice (e.g. a synchronous rejection
 * later echoed by a DSN report anyway) is harmless.
 *
 * A `delayed` action is a transient DSN report (the message is still queued
 * at the recipient server), not a bounce — it's skipped entirely. Marking it
 * bounced anyway would trip `markBounced`'s idempotency guard, so a genuine
 * `failed` report arriving afterwards for the same delivery would be a
 * silent no-op, leaving the record (and its notification) permanently
 * describing a transient delay as a hard bounce.
 */
export async function processBounceResults(
  results: BounceResult[],
): Promise<void> {
  for (const { correlationId, action } of results) {
    if (action !== 'failed') {
      continue;
    }

    const delivery = await resolve(
      MessageDeliveryService,
    ).markBouncedByCorrelationId(correlationId, FAILED_REASON);

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

    // Reuses the existing `message` realtime resource (rather than a
    // dedicated `message_delivery` one) so the already-wired frontend
    // subscription in the sent-message history just refetches and picks up
    // the new bounce flag. Only ad-hoc Messages appear in that history —
    // `messageId` is null for automated MessageTemplate-triggered
    // deliveries, which have no message-list entry to refresh anyway.
    if (delivery.messageId) {
      void resolve(RealtimeService).emit(
        event.id,
        'message',
        delivery.messageId,
        'updated',
      );
    }

    await MessageBouncedNotification.send({ event, registration, delivery });
  } catch (error) {
    logger.warn(
      `Failed to notify about bounced message delivery ${delivery.id}: ${describeError(error)}`,
    );
  }
}
