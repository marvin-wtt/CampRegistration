import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { NewsletterRouter } from './newsletter.routes.js';
import { NewsletterService } from './newsletter.service.js';
import { NewsletterController } from './newsletter.controller.js';
import { MailableRegistry } from '#app/mail/mail.registry';
import { NewsletterMail } from './newsletter.mail.js';
import { resolve } from '#core/ioc/container';

export class NewsletterModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(NewsletterService).toSelf().inSingletonScope();
    options.bind(NewsletterController).toSelf().inSingletonScope();
  }

  configure() {
    const mailableRegistry = resolve(MailableRegistry);
    mailableRegistry.register(NewsletterMail);
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/newsletters', new NewsletterRouter());
  }
}
