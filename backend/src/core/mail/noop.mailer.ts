// src/mailers/NoOpMailer.ts
import { IMailer, AdvancedMailPayload } from '#core/mail/mail.service.js';
import logger from '#core/logger.js';

export class NoOpMailer implements IMailer {
  public async sendMail(payload: AdvancedMailPayload): Promise<void> {
    // Do nothing or log. Useful for testing or fallback scenarios.
    logger.debug(`No-op email to: ${payload.to}, subject: ${payload.subject}`);
  }

  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public name(): string {
    return 'NoOpMailer';
  }
}
