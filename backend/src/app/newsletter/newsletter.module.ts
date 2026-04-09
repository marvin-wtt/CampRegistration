import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { NewsletterRouter } from './newsletter.routes.js';
import { NewsletterService } from './newsletter.service.js';
import { NewsletterController } from './newsletter.controller.js';

export class NewsletterModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(NewsletterService).toSelf().inSingletonScope();
    options.bind(NewsletterController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/newsletters', new NewsletterRouter());
  }
}
