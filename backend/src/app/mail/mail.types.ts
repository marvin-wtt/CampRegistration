import type i18n from '#core/i18n';

export type Address = string | { name: string; address: string };

export type AddressLike = Address | Address[];

export interface MailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  contentDisposition?: 'attachment' | 'inline';
}

export type MailPriority = 'low' | 'normal' | 'high';

export interface Envelope {
  subject: string;
  to: AddressLike;
  from?: Address | undefined;
  replyTo?: AddressLike | undefined;
  cc?: AddressLike | undefined;
  bcc?: AddressLike | undefined;
  priority?: MailPriority | undefined;
  headers?: Record<string, string> | undefined;
}

export interface TextContent {
  text: string;
}

export interface ViewContent {
  template: string;
  context: Record<string, unknown>;
  text?: string;
}

export interface HtmlContent extends TextContent {
  html: string;
}

export type Content = ViewContent | HtmlContent | Required<TextContent>;

export interface BuiltMail extends Envelope {
  text?: string;
  html?: string;
  attachments?: MailAttachment[];
}

export type Translator = typeof i18n.t;

export interface TranslationOptions {
  namespace?: string | undefined;
  keyPrefix?: string | undefined;
}
