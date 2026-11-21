import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { NewsletterSubscriberRouter } from './newsletter-subscriber.routes.js';
import { NewsletterUnsubscribeRouter } from './newsletter-unsubscribe.routes.js';
import { NewsletterConfirmRouter } from './newsletter-confirm.routes.js';
import { NewsletterSubscriberService } from './newsletter-subscriber.service.js';
import { NewsletterSubscriberController } from './newsletter-subscriber.controller.js';
import { NewsletterConfirmationMail } from './newsletter-subscriber.mail.js';
import { MailableRegistry } from '#core/mail/mail.registry';
import { resolve } from '#core/ioc/container';
import logger from '#core/logger';
import type { ScopedPermissions } from '@camp-registration/common/permissions';

export class NewsletterSubscriberModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(NewsletterSubscriberService).toSelf().inSingletonScope();
    options.bind(NewsletterSubscriberController).toSelf().inSingletonScope();
  }

  configure() {
    resolve(MailableRegistry).register(NewsletterConfirmationMail);
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter(
      '/newsletters/unsubscribe',
      new NewsletterUnsubscribeRouter(),
    );
    router.useRouter('/newsletters/confirm', new NewsletterConfirmRouter());
    router.useRouter(
      '/newsletters/:newsletterId/subscribers',
      new NewsletterSubscriberRouter(),
    );
  }

  registerJobs(scheduler: JobScheduler): void {
    scheduler.schedule(
      'newsletter-pending-subscriber-cleanup',
      '30 4 * * *',
      async () => {
        const count = await resolve(
          NewsletterSubscriberService,
        ).deleteExpiredPendingSubscribers();
        logger.info(
          `Deleted ${count.toString()} unconfirmed newsletter subscriber(s)`,
        );
      },
    );
  }

  registerPermissions(): ScopedPermissions {
    return {
      newsletter: {
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
      },
    };
  }
}
