import type {
  AppModule,
  AppRouter,
  BindOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import { OrganizationRouter } from './organization.routes.js';
import { OrganizationService } from './organization.service.js';
import { OrganizationController } from './organization.controller.js';
import type {
  OrganizationRole,
  OrganizationPermission,
} from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import { MailableRegistry } from '#app/mail/mail.registry';
import {
  OrganizationReviewPendingMessage,
  OrganizationVerifiedMessage,
  OrganizationRejectedMessage,
} from './organization.messages.js';

export class OrganizationModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(OrganizationService).toSelf().inSingletonScope();
    options.bind(OrganizationController).toSelf().inSingletonScope();
  }

  configure() {
    const registry = resolve(MailableRegistry);
    registry.register(OrganizationReviewPendingMessage);
    registry.register(OrganizationVerifiedMessage);
    registry.register(OrganizationRejectedMessage);
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/organizations', new OrganizationRouter());
  }

  registerOrganizationPermissions(): RoleToPermissions<
    OrganizationRole,
    OrganizationPermission
  > {
    return {
      ADMIN: [
        'organization.view',
        'organization.edit',
        'organization.delete',
        'organization.camps.view',
        'organization.camps.create',
        'organization.newsletters.create',
      ],
      MEMBER: ['organization.view', 'organization.camps.create'],
    };
  }
}
