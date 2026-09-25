import type {
  AppModule,
  AppRouter,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import { OrganizationMemberRouter } from './organization-member.routes.js';
import { OrganizationMemberService } from './organization-member.service.js';
import { OrganizationMemberController } from './organization-member.controller.js';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import { AccountLifecycle } from '#app/user/account.lifecycle';

export class OrganizationMemberModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(OrganizationMemberService).toSelf().inSingletonScope();
    options.bind(OrganizationMemberController).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): void {
    resolve(AccountLifecycle).onEmailVerified((account) =>
      resolve(OrganizationMemberService).resolveMemberInvitations(account),
    );
  }

  registerApiRoutes(router: AppRouter): void {
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
