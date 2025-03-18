import { NodeMailer } from '#core/mail/node.mailer.js';
import type { IMailer } from '#core/mail/mail.service.js';

export class MailFactory {
  // Mailers that are used in descending order
  private mailers: IMailer[] = [new NodeMailer()];

  async createMailer(): Promise<IMailer> {
    for (const mailer of this.mailers) {
      try {
        if (await mailer.isAvailable()) {
          return mailer;
        }
      } catch (ignored) {
        // Ignored
      }
    }

    throw new Error('No mailer available');
  }
}
