import { injectable } from 'inversify';
import {
  ImapFlow,
  type FetchMessageObject,
  type MailboxLockObject,
} from 'imapflow';
import PostalMime, { type Attachment } from 'postal-mime';
import config from '#config/index';
import logger from '#core/logger';
import { describeError } from '#utils/errors';

export type BounceAction = 'failed' | 'delayed';

export interface BounceResult {
  /** The DSN ENVID, echoed back as Original-Envelope-Id — see mail.base.ts. */
  correlationId: string;
  action: BounceAction;
}

// The per-message DSN fields are a flat RFC 822-style block (Action:,
// Original-Envelope-Id:, ...), read straight out of the `message/delivery-
// status` part postal-mime exposes as its own attachment (verified
// empirically — unlike mailparser, which folds that part into `.text`
// alongside any human-readable part instead of keeping it separate).
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

function attachmentText(content: Attachment['content']): string {
  if (typeof content === 'string') {
    return content;
  }

  const bytes =
    content instanceof ArrayBuffer ? new Uint8Array(content) : content;

  return Buffer.from(bytes).toString('utf8');
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
  // Resolved once and reused for the life of the process: the mailbox either
  // has a Trash folder or it doesn't, so re-listing folders (and re-warning
  // on every 5-minute poll if it doesn't) would just spam the log for a fact
  // that isn't going to change between polls.
  private trashFolderPath: string | null | undefined;

  async pollOnce(): Promise<BounceResult[]> {
    const bounceConfig = config.email.bounce;
    if (!bounceConfig) {
      return [];
    }

    const client = await this.connect(bounceConfig);
    try {
      return await this.readBounces(client);
    } finally {
      await this.logout(client);
    }
  }

  /**
   * Confirms the bounce mailbox is reachable, without reading it.
   */
  async verify(): Promise<void> {
    const bounceConfig = config.email.bounce;
    if (!bounceConfig) {
      return;
    }

    try {
      const client = await this.connect(bounceConfig);
      await this.logout(client);
    } catch {
      // Already logged with full context by connect().
    }
  }

  private async connect(
    bounceConfig: NonNullable<typeof config.email.bounce>,
  ): Promise<ImapFlow> {
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

    return client;
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
    // reuses IMAP's own state instead of a separate cursor. This is the
    // authoritative "processed" marker; moving to Trash below is best-effort
    // tidiness on top of it, not a substitute for it.
    await client.messageFlagsAdd(uids, ['\\Seen'], { uid: true });

    await this.moveToTrash(client, uids);

    return results;
  }

  private async moveToTrash(client: ImapFlow, uids: number[]): Promise<void> {
    try {
      const trash = await this.resolveTrashFolder(client);
      if (!trash) {
        return;
      }

      await client.messageMove(uids, trash, { uid: true });
    } catch (error) {
      logger.warn(
        `Failed to move processed bounce messages to Trash: ${describeError(error)}`,
      );
    }
  }

  /**
   * Resolves the mailbox's Trash folder regardless of naming convention
   * (e.g. Gmail's `[Gmail]/Trash` vs. a plain `Trash`) — imapflow detects it
   * via the SPECIAL-USE extension, XLIST, or known localized names. Cached
   * for the life of the process (see `trashFolderPath`).
   */
  private async resolveTrashFolder(
    client: ImapFlow,
  ): Promise<string | undefined> {
    if (this.trashFolderPath !== undefined) {
      return this.trashFolderPath ?? undefined;
    }

    const folders = await client.list();
    const trash = folders.find((folder) => folder.specialUse === '\\Trash');
    this.trashFolderPath = trash?.path ?? null;

    if (!this.trashFolderPath) {
      logger.warn(
        'No Trash folder found in the bounce mailbox; processed messages stay in INBOX marked \\Seen.',
      );
    }

    return this.trashFolderPath ?? undefined;
  }

  private async parseMessage(
    message: FetchMessageObject,
  ): Promise<BounceResult | undefined> {
    if (!message.source) {
      return undefined;
    }

    try {
      const mail = await PostalMime.parse(message.source);
      const deliveryStatus = mail.attachments.find(
        (attachment) => attachment.mimeType === 'message/delivery-status',
      );
      if (!deliveryStatus) {
        return undefined;
      }

      return extractBounce(attachmentText(deliveryStatus.content));
    } catch (error) {
      logger.warn(
        `Failed to parse bounce mailbox message uid=${String(message.uid)}: ${describeError(error)}`,
      );
      return undefined;
    }
  }
}
