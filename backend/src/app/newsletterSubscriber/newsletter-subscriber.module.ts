import type {
  AppModule,
  AppRouter,
  BindOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import { NewsletterSubscriberRouter } from './newsletter-subscriber.routes.js';
import { NewsletterUnsubscribeRouter } from './newsletter-unsubscribe.routes.js';
import { NewsletterSubscriberService } from './newsletter-subscriber.service.js';
import { NewsletterSubscriberController } from './newsletter-subscriber.controller.js';
import type {
  NewsletterManagerRole,
  NewsletterPermission,
} from '@camp-registration/common/permissions';

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

  registerNewsletterPermissions(): RoleToPermissions<
    NewsletterManagerRole,
    NewsletterPermission
  > {
    return {
      OWNER: [
        'newsletter.subscribers.view',
        'newsletter.subscribers.create',
        'newsletter.subscribers.delete',
      ],
      EDITOR: [
        'newsletter.subscribers.view',
        'newsletter.subscribers.create',
        'newsletter.subscribers.delete',
      ],
      VIEWER: ['newsletter.subscribers.view'],
    };
  }
}
