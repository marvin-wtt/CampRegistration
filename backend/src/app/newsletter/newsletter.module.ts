import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { NewsletterRouter } from './newsletter.routes.js';
import { newsletterScopeResolver } from './newsletter.guard.js';
import { NewsletterService } from './newsletter.service.js';
import { NewsletterController } from './newsletter.controller.js';
import type { ScopeResolvers } from '#core/permission.guard';
import type { ScopedPermissions } from '@camp-registration/common/permissions';

export class NewsletterModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(NewsletterService).toSelf().inSingletonScope();
    options.bind(NewsletterController).toSelf().inSingletonScope();
  }

  registerScopeResolvers(): ScopeResolvers {
    return { newsletter: newsletterScopeResolver };
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/newsletters', new NewsletterRouter());
  }

  registerPermissions(): ScopedPermissions {
    return {
      newsletter: {
        OWNER: ['newsletter.view', 'newsletter.edit', 'newsletter.delete'],
        EDITOR: ['newsletter.view', 'newsletter.edit'],
        VIEWER: ['newsletter.view'],
      },
    };
  }
}
