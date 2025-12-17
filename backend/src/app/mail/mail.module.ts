import type { AppModule } from '#core/base/AppModule';
import mailService from '#app/mail/mail.service';
import { mailQueue } from '#app/mail/mail.queue';
import { createMailableFromJob } from '#app/mail/mail.registry';

export class MailModule implements AppModule {
  async configure() {
    await mailService.connect();

    mailQueue.process(async (job) => {
      await mailService.sendMail(createMailableFromJob(job));
    });
  }

  async shutdown(): Promise<void> {
    await mailQueue.close();
    await mailService.close();
  }
}
