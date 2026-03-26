import type {
  AppModule,
  AppRouter,
  BindOptions,
} from '#core/base/AppModule';
import { NewsletterRouter } from './newsletter.routes.js';
import { NewsletterManagerRouter } from './newsletter-manager.routes.js';
import { NewsletterSubscriberRouter } from './newsletter-subscriber.routes.js';
import { NewsletterUnsubscribeRouter } from './newsletter-unsubscribe.routes.js';
import { NewsletterService } from './newsletter.service.js';
import { NewsletterController } from './newsletter.controller.js';
import { NewsletterManagerService } from './newsletter-manager.service.js';
import { NewsletterManagerController } from './newsletter-manager.controller.js';
import { NewsletterSubscriberService } from './newsletter-subscriber.service.js';
import { NewsletterSubscriberController } from './newsletter-subscriber.controller.js';
import { MailableRegistry } from '#app/mail/mail.registry';
import { NewsletterMail } from './newsletter.mail.js';
import { resolve } from '#core/ioc/container';

export class NewsletterModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(NewsletterService).toSelf().inSingletonScope();
    options.bind(NewsletterController).toSelf().inSingletonScope();
    options.bind(NewsletterManagerService).toSelf().inSingletonScope();
    options.bind(NewsletterManagerController).toSelf().inSingletonScope();
    options.bind(NewsletterSubscriberService).toSelf().inSingletonScope();
    options.bind(NewsletterSubscriberController).toSelf().inSingletonScope();
  }

  configure() {
    const mailableRegistry = resolve(MailableRegistry);
    mailableRegistry.register(NewsletterMail);
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/newsletters/unsubscribe', new NewsletterUnsubscribeRouter());
    router.useRouter('/newsletters/:newsletterId/managers', new NewsletterManagerRouter());
    router.useRouter('/newsletters/:newsletterId/subscribers', new NewsletterSubscriberRouter());
    router.useRouter('/newsletters', new NewsletterRouter());
  }
}
