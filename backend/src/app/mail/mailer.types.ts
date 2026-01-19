import type {
  AddressLike,
  BuiltMail,
  MailPriority,
} from '#app/mail/mail.types';

export interface MailPayload {
  to: AddressLike;
  replyTo?: AddressLike | undefined;
  priority?: MailPriority | undefined;
  subject: string;
  body: string; // The compiled text/HTML
  attachments?: { filename: string; content: Buffer | string }[] | undefined;
}

export interface TemplateMailData extends Omit<MailPayload, 'body'> {
  template: string;
  context: Record<string, unknown>;
}

export interface IMailer {
  sendMail(payload: BuiltMail): Promise<void> | void;

  isAvailable(): Promise<boolean> | boolean;

  name(): string;

  close(): Promise<void> | void;
}
