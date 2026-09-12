import type { BuiltMail } from '#core/mail/mail.types';

export interface SendMailResult {
  /** Recipient addresses the server rejected synchronously, during the send itself. */
  rejected: string[];
}

export interface IMailer {
  sendMail(payload: BuiltMail): Promise<SendMailResult> | SendMailResult;

  verify(): Promise<void> | void;

  name(): string;

  close(): Promise<void> | void;
}
