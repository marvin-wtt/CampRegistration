import type { IMailer } from '#app/mail/mailer.types';
import logger from '#core/logger';
import type { Address, BuiltMail } from '#app/mail/mail.types';

export class NoOpMailer implements IMailer {
  public sendMail(payload: BuiltMail): void {
    // Do nothing or log. Useful for testing or fallback scenarios.
    logger.debug(
      `No-op email to: ${this.mailToString(payload.to)}, subject: ${payload.subject}`,
    );
  }

  private mailToString(mails: BuiltMail['to']): string {
    const converter = (mail: Address): string => {
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

  public close(): void {
    // No operation for noop mailer
  }
}
