import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { OrganizationMemberRouter } from './organization-member.routes.js';
import { OrganizationMemberService } from './organization-member.service.js';
import { OrganizationMemberController } from './organization-member.controller.js';
import type { ScopedPermissions } from '@camp-registration/common/permissions';

export class OrganizationMemberModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(OrganizationMemberService).toSelf().inSingletonScope();
    options.bind(OrganizationMemberController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter(
      '/organizations/:organizationId/members',
      new OrganizationMemberRouter(),
    );
  }

  registerPermissions(): ScopedPermissions {
    return {
      organization: {
        ADMIN: [
          'organization.members.view',
          'organization.members.create',
          'organization.members.edit',
          'organization.members.delete',
        ],
        MEMBER: ['organization.members.view'],
      },
    };
  }
}
