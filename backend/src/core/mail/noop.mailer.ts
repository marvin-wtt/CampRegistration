// src/mailers/NoOpMailer.ts
import type { IMailer, AdvancedMailPayload } from '#core/mail/mail.service.js';
import logger from '#core/logger.js';

export class NoOpMailer implements IMailer {
  public sendMail(payload: AdvancedMailPayload): void {
    // Do nothing or log. Useful for testing or fallback scenarios.
    logger.debug(
      `No-op email to: ${this.mailToString(payload.to)}, subject: ${payload.subject}`,
    );
  }

  private mailToString(mail: AdvancedMailPayload['to']): string {
    return typeof mail === 'object' ? mail.address : mail;
  }

  public isAvailable(): boolean {
    return true;
  }

  public name(): string {
    return 'NoOpMailer';
  }
}
