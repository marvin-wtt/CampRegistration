import type {
  AppModule,
  AppRouter,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import { NewsletterManagerRouter } from './newsletter-manager.routes.js';
import { NewsletterManagerService } from './newsletter-manager.service.js';
import { NewsletterManagerController } from './newsletter-manager.controller.js';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import { AccountLifecycle } from '#app/user/account.lifecycle';

export class NewsletterManagerModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(NewsletterManagerService).toSelf().inSingletonScope();
    options.bind(NewsletterManagerController).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): void {
    resolve(AccountLifecycle).blockDeletion((userId) =>
      resolve(NewsletterManagerService).getSoleOwnerNewsletters(userId),
    );
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter(
      '/newsletters/:newsletterId/managers',
      new NewsletterManagerRouter(),
    );
  }

  registerPermissions(): ScopedPermissions {
    return {
      newsletter: {
        OWNER: [
          'newsletter.managers.view',
          'newsletter.managers.create',
          'newsletter.managers.delete',
        ],
        EDITOR: ['newsletter.managers.view'],
        VIEWER: [],
      },
    };
  }
}
