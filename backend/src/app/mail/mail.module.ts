import type { AppModule } from '#core/base/AppModule';
import { MailService } from '#app/mail/mail.service';
import { container } from '#core/ioc/container.js';

export class MailModule implements AppModule {
  private mailService: MailService;

  constructor() {
    this.mailService = container.get(MailService, {
      autobind: true,
    });
  }

  async configure() {
    await this.mailService.connect();
  }

  async shutdown(): Promise<void> {
    await this.mailService.close();
  }
}
