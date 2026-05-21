import type {
  AppModule,
  AppRouter,
  BindOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import { NewsletterMessageRouter } from './newsletter-message.routes.js';
import { NewsletterMessageService } from './newsletter-message.service.js';
import { NewsletterMessageController } from './newsletter-message.controller.js';
import { MailableRegistry } from '#app/mail/mail.registry';
import { NewsletterMessageMail } from '#app/newsletterMessage/newsletter-message.mail';
import { resolve } from '#core/ioc/container';
import type {
  NewsletterManagerRole,
  NewsletterPermission,
} from '@camp-registration/common/permissions';

export class NewsletterMessageModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(NewsletterMessageService).toSelf().inSingletonScope();
    options.bind(NewsletterMessageController).toSelf().inSingletonScope();
  }

  configure() {
    const mailableRegistry = resolve(MailableRegistry);
    mailableRegistry.register(NewsletterMessageMail);
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter(
      '/newsletters/:newsletterId/messages',
      new NewsletterMessageRouter(),
    );
  }

  registerNewsletterPermissions(): RoleToPermissions<
    NewsletterManagerRole,
    NewsletterPermission
  > {
    return {
      OWNER: [
        'newsletter.messages.view',
        'newsletter.messages.create',
        'newsletter.messages.delete',
      ],
      EDITOR: [
        'newsletter.messages.view',
        'newsletter.messages.create',
        'newsletter.messages.delete',
      ],
      VIEWER: ['newsletter.messages.view'],
    };
  }
}
