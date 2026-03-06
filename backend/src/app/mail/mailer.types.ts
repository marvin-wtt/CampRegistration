import type { BuiltMail } from '#app/mail/mail.types';

export interface IMailer {
  sendMail(payload: BuiltMail): Promise<void> | void;

  verify(): Promise<void> | void;

  name(): string;

  close(): Promise<void> | void;
}
