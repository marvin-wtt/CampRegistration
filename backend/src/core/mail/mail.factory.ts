import type { AppConfig } from '#config';
import { SmtpMailer } from '#core/mail/drivers/smtp/smtp.mailer';
import type { IMailer } from '#core/mail/mailer.types';
import { NoOpMailer } from '#core/mail/drivers/noop.mailer';
import { MailjetMailer } from '#core/mail/drivers/mailjet/mailjet.mailer';

export type MailDriver = AppConfig['email']['driver'];

// Record<MailDriver, ...>, not Record<string, ...>: adding a driver to
// EMAIL_DRIVER's zod enum without registering it here is then a compile
// error, not a message discovered by starting the app.
const mailers: Record<MailDriver, new () => IMailer> = {
  smtp: SmtpMailer,
  mailjet: MailjetMailer,
  noop: NoOpMailer,
};

function isMailDriver(driver: string): driver is MailDriver {
  return driver in mailers;
}

export class MailFactory {
  // Takes a plain string (not `MailDriver`) so a config value that somehow
  // isn't one of the known drivers fails with a clear message instead of a
  // TypeScript error at a call site that has no way to recover either way.
  createMailer(driver: string): IMailer {
    if (isMailDriver(driver)) {
      return new mailers[driver]();
    }

    throw new Error(
      `Invalid mailer driver '${driver}'. Available: ${Object.keys(mailers).join(',')}`,
    );
  }
}
