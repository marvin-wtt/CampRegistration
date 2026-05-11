import type { AppModule, BindOptions } from '#core/base/AppModule';
import { MailService } from '#app/mail/mail.service';
import { resolve } from '#core/ioc/container';
import { MailableRegistry } from '#app/mail/mail.registry';

export class MailModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(MailableRegistry).toSelf().inSingletonScope();
    options.bind(MailService).toSelf().inSingletonScope();
  }

  async configure() {
    await resolve(MailService).connect();
  }

  async shutdown(): Promise<void> {
    await resolve(MailService).close();
  }
}
