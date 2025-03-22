import type {
  IMailer,
  AdvancedMailPayload,
  MailAddress,
} from '#core/mail/mail.types';
import logger from '#core/logger.js';

export class NoOpMailer implements IMailer {
  public sendMail(payload: AdvancedMailPayload): void {
    // Do nothing or log. Useful for testing or fallback scenarios.
    logger.debug(
      `No-op email to: ${this.mailToString(payload.to)}, subject: ${payload.subject}`,
    );
  }

  private mailToString(mails: AdvancedMailPayload['to']): string {
    const converter = (mail: MailAddress): string => {
      return typeof mail === 'object' ? mail.address : mail;
    };

    return Array.isArray(mails)
      ? mails.map(converter).join(', ')
      : converter(mails);
  }

  public isAvailable(): boolean {
    return true;
  }

  public name(): string {
    return 'NoOpMailer';
  }
}
