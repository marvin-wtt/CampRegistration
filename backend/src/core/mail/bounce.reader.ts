import { injectable } from 'inversify';
import {
  ImapFlow,
  type FetchMessageObject,
  type MailboxLockObject,
} from 'imapflow';
import { simpleParser } from 'mailparser';
import config from '#config/index';
import logger from '#core/logger';

export type BounceAction = 'failed' | 'delayed';

export interface BounceResult {
  /** The DSN ENVID, echoed back as Original-Envelope-Id — see mail.base.ts. */
  correlationId: string;
  action: BounceAction;
}

// mailparser has no structural support for `message/delivery-status` parts
// (verified empirically: it folds their raw content into `.text` alongside
// any human-readable part, rather than exposing them via `.attachments` the
// way it does `message/rfc822`). The per-message DSN fields are otherwise a
// flat RFC 822-style block, so read them straight out of `.text`.
const ACTION_PATTERN = /^Action:\s*(\S+)/im;
const ORIGINAL_ENVELOPE_ID_PATTERN = /^Original-Envelope-Id:\s*(.+)$/im;

export function extractBounce(text: string): BounceResult | undefined {
  const actionMatch = ACTION_PATTERN.exec(text);
  const envelopeIdMatch = ORIGINAL_ENVELOPE_ID_PATTERN.exec(text);
  if (!actionMatch || !envelopeIdMatch) {
    return undefined;
  }

  const action = actionMatch[1].toLowerCase();
  if (action !== 'failed' && action !== 'delayed') {
    return undefined;
  }

  return {
    action,
    correlationId: envelopeIdMatch[1].trim().replace(/^<|>$/g, ''),
  };
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Polls the configured bounce mailbox for async DSN reports (RFC 3464) — the
 * complement to the synchronous rejection already available from
 * `SmtpMailer.sendMail`'s own return value. Generic and Prisma-free: it
 * knows nothing about `MessageDelivery`, only how to get a batch of
 * `{correlationId, action}` pairs out of an IMAP mailbox.
 */
@injectable()
export class BounceReader {
  async pollOnce(): Promise<BounceResult[]> {
    const bounceConfig = config.email.bounce;
    if (!bounceConfig) {
      return [];
    }

    const client = new ImapFlow({
      host: bounceConfig.host,
      port: bounceConfig.port,
      secure: bounceConfig.secure,
      auth: bounceConfig.auth.user
        ? { user: bounceConfig.auth.user, pass: bounceConfig.auth.pass }
        : undefined,
      logger: false,
    });

    try {
      await client.connect();
    } catch (error) {
      logger.error(
        `Failed to connect to bounce mailbox ${bounceConfig.host}:${String(bounceConfig.port)}: ${describeError(error)}`,
      );
      throw error;
    }

    try {
      return await this.readBounces(client);
    } finally {
      await this.logout(client);
    }
  }

  private async logout(client: ImapFlow): Promise<void> {
    try {
      await client.logout();
    } catch (error) {
      logger.warn(
        `Failed to log out of bounce mailbox: ${describeError(error)}`,
      );
    }
  }

  private async readBounces(client: ImapFlow): Promise<BounceResult[]> {
    const lock = await client.getMailboxLock('INBOX');
    try {
      return await this.fetchBounces(client);
    } catch (error) {
      logger.error(
        `Bounce mailbox poll failed while reading INBOX: ${describeError(error)}`,
      );
      throw error;
    } finally {
      // A cleanup failure here must never mask a real error from the try
      // block above (a throw from finally replaces the in-flight one).
      this.releaseLock(lock);
    }
  }

  private releaseLock(lock: MailboxLockObject): void {
    try {
      lock.release();
    } catch (error) {
      logger.warn(
        `Failed to release bounce mailbox lock: ${describeError(error)}`,
      );
    }
  }

  private async fetchBounces(client: ImapFlow): Promise<BounceResult[]> {
    const uids = await client.search({ seen: false }, { uid: true });
    if (!uids || uids.length === 0) {
      return [];
    }

    const results: BounceResult[] = [];
    for await (const message of client.fetch(
      uids,
      { source: true },
      { uid: true },
    )) {
      const bounce = await this.parseMessage(message);
      if (bounce) {
        results.push(bounce);
      }
    }

    // Mark every fetched message seen regardless of outcome (matched,
    // unmatched, or unparseable) so nothing here is ever reprocessed —
    // reuses IMAP's own state instead of a separate cursor.
    await client.messageFlagsAdd(uids, ['\\Seen'], { uid: true });

    return results;
  }

  private async parseMessage(
    message: FetchMessageObject,
  ): Promise<BounceResult | undefined> {
    if (!message.source) {
      return undefined;
    }

    try {
      const mail = await simpleParser(message.source);
      return extractBounce(mail.text ?? '');
    } catch (error) {
      logger.warn(
        `Failed to parse bounce mailbox message uid=${String(message.uid)}: ${describeError(error)}`,
      );
      return undefined;
    }
  }
}
