import type {
  AppModule,
  AppRouter,
  BindOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import { NewsletterRouter } from './newsletter.routes.js';
import { NewsletterService } from './newsletter.service.js';
import { NewsletterController } from './newsletter.controller.js';
import type {
  NewsletterManagerRole,
  NewsletterPermission,
} from '@camp-registration/common/permissions';

export class NewsletterModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(NewsletterService).toSelf().inSingletonScope();
    options.bind(NewsletterController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/newsletters', new NewsletterRouter());
  }

  registerNewsletterPermissions(): RoleToPermissions<
    NewsletterManagerRole,
    NewsletterPermission
  > {
    return {
      OWNER: ['newsletter.view', 'newsletter.edit', 'newsletter.delete'],
      EDITOR: ['newsletter.view', 'newsletter.edit'],
      VIEWER: ['newsletter.view'],
    };
  }
}
