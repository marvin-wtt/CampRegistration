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

/**
 * Consumes one polled batch. Must resolve only once the batch is durably
 * dealt with: {@link BounceReader.pollOnce} acknowledges the underlying IMAP
 * messages afterwards, and a rejection leaves them unacknowledged for the
 * next poll.
 */
export type BounceHandler = (results: BounceResult[]) => Promise<void>;

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
  if (action !== 'failed') {
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
 * `{correlationId, action}` pairs out of an IMAP mailbox and hand it to a
 * {@link BounceHandler}.
 */
@injectable()
export class BounceReader {
  // Resolved once and reused for the life of the process: the mailbox either
  // has a Trash folder or it doesn't, so re-listing folders (and re-warning
  // on every 5-minute poll if it doesn't) would just spam the log for a fact
  // that isn't going to change between polls.
  private trashFolderPath: string | null | undefined;

  /**
   * Reads the mailbox, passes every bounce found to `handle`, and only then
   * acknowledges the messages it read. Rejects if `handle` does.
   */
  async pollOnce(handle: BounceHandler): Promise<void> {
    const bounceConfig = config.email.bounce;
    if (!bounceConfig) {
      return;
    }

    const client = await this.connect(bounceConfig);
    try {
      await this.readBounces(client, handle);
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

  private async readBounces(
    client: ImapFlow,
    handle: BounceHandler,
  ): Promise<void> {
    const lock = await client.getMailboxLock('INBOX');
    try {
      await this.fetchBounces(client, handle);
    } catch (error) {
      logger.error(`Bounce mailbox poll failed: ${describeError(error)}`);
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

  private async fetchBounces(
    client: ImapFlow,
    handle: BounceHandler,
  ): Promise<void> {
    const uids = await client.search({ seen: false }, { uid: true });
    if (!uids || uids.length === 0) {
      return;
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

    // Hand the batch over *before* acknowledging it: the IMAP flags are the
    // only record of what has been processed, so acknowledging first would
    // lose the whole batch if `handle` then failed, whereas failing first
    // just leaves the messages unseen for the next poll. Redelivering a
    // batch is safe because acting on a bounce is idempotent (see
    // `MessageDeliveryService.markBounced`), which also covers a `handle`
    // that failed part-way through.
    await handle(results);

    await this.acknowledge(client, uids);
  }

  /**
   * Marks every fetched message seen regardless of outcome (matched,
   * unmatched, or unparseable) so nothing here is ever reprocessed —
   * reuses IMAP's own state instead of a separate cursor. This is the
   * authoritative "processed" marker; moving to Trash is best-effort
   * tidiness on top of it, not a substitute for it.
   */
  private async acknowledge(client: ImapFlow, uids: number[]): Promise<void> {
    await client.messageFlagsAdd(uids, ['\\Seen'], { uid: true });

    await this.moveToTrash(client, uids);
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
        // This mailbox is dedicated to DSN reports, so anything without one
        // is unexpected (e.g. a misdirected reply or a bounce the sending
        // server rendered as plain text). It still gets marked seen and
        // moved to Trash like any other processed message — this is purely
        // so it shows up somewhere rather than vanishing silently.
        logger.warn(
          `Bounce mailbox message uid=${String(message.uid)} has no delivery-status part; skipping.`,
        );
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
