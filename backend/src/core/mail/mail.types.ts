import type { Readable } from 'stream';

export type Address = string | { name: string; address: string };

export type AddressLike = Address | Address[];

export interface MailAttachment {
  filename: string;
  content: Buffer | Readable | string;
  contentType?: string;
  contentDisposition?: 'attachment' | 'inline';
}

export type MailPriority = 'low' | 'normal' | 'high';

export type DsnNotifyCondition = 'FAILURE' | 'DELAY' | 'SUCCESS' | 'NEVER';

// Requests an RFC 3461 delivery status notification. `notify` maps to the
// SMTP NOTIFY= envelope parameter. There is deliberately no `envid`/`ret`
// here: the mailer sets ENVID from `messageId` (see below), which the
// receiving server MUST echo back verbatim as `Original-Envelope-Id` in the
// bounce report, so the outgoing Message-ID doubles as the correlation key.
export interface DsnOptions {
  notify: DsnNotifyCondition[];
}

export interface Envelope {
  subject: string;
  to: AddressLike;
  from?: Address | undefined;
  replyTo?: AddressLike | undefined;
  cc?: AddressLike | undefined;
  bcc?: AddressLike | undefined;
  priority?: MailPriority | undefined;
  headers?: Record<string, string> | undefined;
  // Set explicitly (rather than left to the mailer) so it's known before
  // sending and can be persisted for later bounce correlation.
  messageId?: string | undefined;
  dsn?: DsnOptions | undefined;
}

export interface TextContent {
  text: string;
}

export interface ViewContent {
  template: string;
  context: Record<string, unknown>;
  text?: string;
}

export interface HtmlContent extends Partial<TextContent> {
  html: string;
}

export type Content = ViewContent | HtmlContent | TextContent;

export interface BuiltMail extends Envelope {
  text?: string;
  html?: string;
  attachments?: MailAttachment[];
}

export type Translator = (
  key: string,
  context?: Record<string, unknown>,
) => string;

export interface TranslationOptions {
  namespace?: string | undefined;
  keyPrefix?: string | undefined;
}
