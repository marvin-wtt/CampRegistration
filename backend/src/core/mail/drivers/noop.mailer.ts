import type { IMailer, SendMailResult } from '#core/mail/mailer.types';
import logger from '#core/logger';
import type { BuiltMail } from '#core/mail/mail.types';
import { addressLikeToString } from '#core/mail/mail.utils';

export class NoOpMailer implements IMailer {
  public sendMail(payload: BuiltMail): SendMailResult {
    // Do nothing or log. Useful for testing or fallback scenarios.
    logger.debug(
      `No-op email to: ${addressLikeToString(payload.to)}, subject: ${payload.subject}`,
    );

    return { rejected: [] };
  }

  public verify(): void {
    return;
  }

  public name(): string {
    return 'NoOpMailer';
  }

  public close(): void {
    // No operation for noop mailer
  }
}
