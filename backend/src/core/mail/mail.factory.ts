import { SmtpMailer } from '#core/mail/smtp.mailer';
import type { IMailer } from '#core/mail/mailer.types';
import { NoOpMailer } from '#core/mail/noop.mailer';

export class MailFactory {
  // Available mailer drivers
  private mailers: Record<string, new () => IMailer> = {
    smtp: SmtpMailer,
    noop: NoOpMailer,
  };

  createMailer(driver: string): IMailer {
    if (driver in this.mailers) {
      const cls = this.mailers[driver];

      return new cls();
    }

    throw new Error(
      `Invalid mailer driver '${driver}'. Available: ${Object.keys(this.mailers).join(',')}`,
    );
  }
}
