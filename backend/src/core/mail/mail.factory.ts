import { NodeMailer } from '#core/mail/node.mailer';
import type { IMailer } from '#core/mail/mail.types';
import logger from '#core/logger';

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
