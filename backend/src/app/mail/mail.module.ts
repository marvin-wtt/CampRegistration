import type { AppModule } from '#core/base/AppModule';
import { MailService } from '#app/mail/mail.service';
import { container, resolve } from '#core/ioc/container';

export class MailModule implements AppModule {
  bindContainers() {
    container.bind(MailService).toSelf().inSingletonScope();
  }

  async configure() {
    await resolve(MailService).connect();
  }

  async shutdown(): Promise<void> {
    await resolve(MailService).close();
  }
}
