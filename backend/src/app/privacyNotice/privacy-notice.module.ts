import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { PrivacyNoticeService } from './privacy-notice.service.js';
import { PrivacyNoticeController } from './privacy-notice.controller.js';
import {
  EventPrivacyNoticeRouter,
  OrganizationPrivacyNoticeRouter,
} from './privacy-notice.routes.js';

export class PrivacyNoticeModule implements AppModule {
  bindContainers(options: BindOptions): void {
    options.bind(PrivacyNoticeService).toSelf().inSingletonScope();
    options.bind(PrivacyNoticeController).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter(
      '/organizations/:organizationId/privacy-notice',
      new OrganizationPrivacyNoticeRouter(),
    );
    router.useRouter(
      '/events/:eventId/privacy-notice',
      new EventPrivacyNoticeRouter(),
    );
  }
}
