import { NodeMailer } from '#core/mail/node.mailer.js';
import { IMailer } from '#core/mail/mail.service.js';
import { NoOpMailer } from '#core/mail/noop.mailer.js';

export class MailFactory {
  // Mailers that are used in descending order
  private mailers: IMailer[] = [new NodeMailer(), new NoOpMailer()];

  async createMailer(): Promise<IMailer> {
    for (const mailer of this.mailers) {
      try {
        if (await mailer.isAvailable()) {
          return mailer;
        }
      } catch (_error) {
        // Ignored
      }
    }

    throw new Error('No mailer available');
  }
}
