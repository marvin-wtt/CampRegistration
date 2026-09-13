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
 * The single path both bounce sources feed: an async DSN report from
 * `BounceReader.pollOnce()` and a synchronous SMTP rejection from
 * `RegistrationTemplateMessage.afterSend()`. `markBouncedByCorrelationId` is
 * idempotent, so seeing the same correlation id twice is harmless.
 */
export async function processBounceResults(
  results: BounceResult[],
): Promise<void> {
  for (const { correlationId } of results) {
    const delivery = await resolve(
      MessageDeliveryService,
    ).markBouncedByCorrelationId(correlationId, FAILED_REASON);

    if (delivery) {
      await notifyMessageBounced(delivery);
    }
  }
}

/**
 * Pushes the realtime update the messaging UI refreshes on, and emails the
 * event's contact address. This is the edge of a bounce the way a controller
 * is the edge of a request, so it emits realtime itself rather than pushing
 * that into `MessageDeliveryService` (which stays realtime-free by
 * convention). Best-effort: a notification failure must not look like
 * marking the bounce failed.
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

    // Reuses the `message` resource so the sent-message history refetches.
    // `messageId` is null for template-triggered deliveries, which have no
    // entry in that history anyway.
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
