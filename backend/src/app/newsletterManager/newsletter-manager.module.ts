import type {
  AppModule,
  AppRouter,
  BindOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import { NewsletterManagerRouter } from './newsletter-manager.routes.js';
import { NewsletterManagerService } from './newsletter-manager.service.js';
import { NewsletterManagerController } from './newsletter-manager.controller.js';
import type {
  NewsletterManagerRole,
  NewsletterPermission,
} from '@camp-registration/common/permissions';

export class NewsletterManagerModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(NewsletterManagerService).toSelf().inSingletonScope();
    options.bind(NewsletterManagerController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter(
      '/newsletters/:newsletterId/managers',
      new NewsletterManagerRouter(),
    );
  }

  registerNewsletterPermissions(): RoleToPermissions<
    NewsletterManagerRole,
    NewsletterPermission
  > {
    return {
      OWNER: [
        'newsletter.managers.view',
        'newsletter.managers.create',
        'newsletter.managers.delete',
      ],
      EDITOR: ['newsletter.managers.view'],
      VIEWER: [],
    };
  }
}
