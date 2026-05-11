import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { NewsletterSubscriberRouter } from './newsletter-subscriber.routes.js';
import { NewsletterUnsubscribeRouter } from './newsletter-unsubscribe.routes.js';
import { NewsletterSubscriberService } from './newsletter-subscriber.service.js';
import { NewsletterSubscriberController } from './newsletter-subscriber.controller.js';

export class NewsletterSubscriberModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(NewsletterSubscriberService).toSelf().inSingletonScope();
    options.bind(NewsletterSubscriberController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter(
      '/newsletters/unsubscribe',
      new NewsletterUnsubscribeRouter(),
    );
    router.useRouter(
      '/newsletters/:newsletterId/subscribers',
      new NewsletterSubscriberRouter(),
    );
  }
}
