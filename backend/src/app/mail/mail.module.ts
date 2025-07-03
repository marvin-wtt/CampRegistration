import type { AppModule } from '#core/base/AppModule';
import mailService from '#app/mail/mail.service';

export class MailModule implements AppModule {
  async configure() {
    await mailService.connect();
  }

  async shutdown(): Promise<void> {
    await mailService.close();
  }
}
