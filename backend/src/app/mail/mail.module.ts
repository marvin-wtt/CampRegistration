import type { AppModule } from '#core/base/AppModule';
import mailService from '#app/mail/mail.service';
import { mailQueue } from '#app/mail/mail.queue';

export class MailModule implements AppModule {
  async configure() {
    await mailService.connect();
    await mailQueue.process((data) => {
      return mailService.sendMail(data);
    });
  }

  async shutdown(): Promise<void> {
    await mailQueue.close();
    await mailService.close();
  }
}
