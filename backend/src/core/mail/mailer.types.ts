import type { RequestHandler } from 'express';
import type { BuiltMail } from '#core/mail/mail.types';
import type { BounceHandler } from '#core/mail/bounce.types';

export interface SendMailResult {
  /** Recipient addresses the server rejected synchronously, during the send itself. */
  rejected: string[];
}

export interface BounceWebhook {
  /**
   * This mailer's own suffix, e.g. `/mailjet/:secret` — `MailModule` mounts
   * it under its shared webhook prefix (`registerApiRoutes`), so this never
   * includes that prefix itself.
   */
  path: string;
  handler: RequestHandler;
}

export interface IMailer {
  sendMail(payload: BuiltMail): Promise<SendMailResult> | SendMailResult;

  verify(): Promise<void> | void;

  name(): string;

  close(): Promise<void> | void;

  /**
   * Confirms this mailer's bounce-detection mechanism, if it has one, is
   * reachable — e.g. the IMAP bounce mailbox. Called alongside `verify()`.
   * Absent for a mailer with nothing to dial into ahead of time (a webhook).
   */
  verifyBounceSource?(): Promise<void> | void;

  /**
   * Pushed by `MailService.onBounce()` — every time the application's bounce
   * handler is set (or later swapped), not just once. A mailer that cares
   * about bounces stores it and calls through to it whenever it actually
   * detects one, rather than receiving it as an argument to
   * `getBounceWebhook`/`getBouncePollJob`: `MailService` owns and constructs
   * the mailer, so it pushes state into it — the mailer never reaches back
   * for it.
   */
  setBounceHandler?(handler: BounceHandler): void;

  /**
   * Describes the inbound bounce-report route this mailer's provider needs,
   * for one that reports bounces via webhook — `MailModule` mounts it. A
   * mailer that doesn't route through a webhook simply doesn't implement
   * this; one that does but isn't fully configured (e.g. no webhook secret
   * set) returns `undefined`. `MailModule` only calls this once a handler is
   * registered (`MailService.onBounce`) — the mailer itself never touches an
   * `AppRouter`.
   */
  getBounceWebhook?(): BounceWebhook | undefined;

  /**
   * The recurring bounce-check task, for a mailer whose provider requires
   * polling (e.g. an IMAP mailbox for DSN reports) — `undefined` when not
   * needed or not configured. `MailModule` owns the job's name and schedule
   * (there's only ever one bounce-poll job, whichever driver is active, so a
   * shared, stable identity is more useful than a per-driver one); the
   * mailer supplies only the work, and never touches a `JobScheduler`.
   */
  getBouncePollJob?(): (() => Promise<void>) | undefined;
}
