import { NodeMailer } from '#app/mail/node.mailer.js';
import type { IMailer } from '#app/mail/mail.types.js';
import logger from '#core/logger.js';

export class MailFactory {
  // Mailers that are used in descending order
  private mailers: IMailer[] = [new NodeMailer()];

  async createMailer(): Promise<IMailer> {
    for (const mailer of this.mailers) {
      try {
        if (await mailer.isAvailable()) {
          return mailer;
        }
      } catch (error) {
        logger.warn(
          `Mailer ${mailer.name()} is not available: ${(error as Error).message}`,
        );
      }
    }

    throw new Error('No available mailer found');
  }
}
