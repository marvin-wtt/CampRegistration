import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { NewsletterMessageRouter } from './newsletter-message.routes.js';
import { NewsletterMessageService } from './newsletter-message.service.js';
import { NewsletterMessageController } from './newsletter-message.controller.js';

export class NewsletterMessageModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(NewsletterMessageService).toSelf().inSingletonScope();
    options.bind(NewsletterMessageController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter(
      '/newsletters/:newsletterId/messages',
      new NewsletterMessageRouter(),
    );
  }
}
