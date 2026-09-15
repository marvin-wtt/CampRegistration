import type { RequestHandler } from 'express';
import { timingSafeEqual } from 'node:crypto';
import config from '#config/index';
import logger from '#core/logger';
import { describeError } from '#utils/errors';
import type { BounceHandler, BounceResult } from '#core/mail/bounce.types';

interface MailjetWebhookEvent {
  event: string;
  CustomID?: string;
  hard_bounce?: boolean;
}

// Only permanent failures count as a bounce, matching the IMAP path's
// `Action: failed` semantics — a soft bounce or spam complaint is logged
// elsewhere in Mailjet's dashboard but never marks a delivery bounced here.
function isBounceEvent(event: MailjetWebhookEvent): boolean {
  return (
    event.event === 'blocked' ||
    (event.event === 'bounce' && event.hard_bounce === true)
  );
}

function matchesSecret(candidate: string, secret: string): boolean {
  const a = Buffer.from(candidate);
  const b = Buffer.from(secret);

  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Receives Mailjet's bounce/blocked event webhook. Authenticated by a secret
 * path segment (`MAILJET_WEBHOOK_SECRET`), not CSRF — see the exemption in
 * `csrf.middleware.ts`. Built by `MailjetMailer.getBounceWebhook`, which
 * passes a `handler` that reads the current bounce handler fresh on every
 * call; this function just calls whatever it's given.
 */
export function createMailjetWebhookHandler(
  handler: BounceHandler,
): RequestHandler {
  return async (req, res) => {
    const secret = config.email.mailjet?.webhookSecret;
    const candidate =
      typeof req.params.secret === 'string' ? req.params.secret : '';
    if (!secret || !matchesSecret(candidate, secret)) {
      res.sendStatus(404);
      return;
    }

    const events = Array.isArray(req.body)
      ? (req.body as MailjetWebhookEvent[])
      : [];

    const results: BounceResult[] = events
      .filter(isBounceEvent)
      .flatMap((event) =>
        event.CustomID
          ? [{ correlationId: event.CustomID, action: 'failed' as const }]
          : [],
      );

    // Ack 200 regardless of outcome below — Mailjet retries on a non-2xx
    // response, and a handler failure is already logged, not something a
    // Mailjet-side retry could fix.
    res.sendStatus(200);

    if (results.length === 0) {
      return;
    }

    try {
      await handler(results);
    } catch (error) {
      logger.error(
        `Failed to process Mailjet bounce webhook: ${describeError(error)}`,
      );
    }
  };
}
