import { NodeMailer } from '#app/mail/node.mailer';
import type { IMailer } from '#app/mail/mailer.types';
import { NoOpMailer } from '#app/mail/noop.mailer';

export class MailFactory {
  // Mailers that are used in descending order
  private mailers: Record<string, new () => IMailer> = {
    smtp: NodeMailer,
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
