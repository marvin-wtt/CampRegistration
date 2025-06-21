import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
} from '#core/base/AppModule';
import { MessageTemplateRouter } from '#app/messageTemplate/message-template.routes';
import type { MessageTemplatePermission } from '@camp-registration/common/permissions';

export class MessageTemplateModule implements AppModule {
  registerRoutes(router: AppRouter): void {
    router.useRouter(
      '/camps/:campId/message-templates',
      new MessageTemplateRouter(),
    );
  }

  registerPermissions(): RoleToPermissions<MessageTemplatePermission> {
    return {
      DIRECTOR: [
        'camp.message_templates.view',
        'camp.message_templates.create',
        'camp.message_templates.edit',
        'camp.message_templates.delete',
      ],
      COORDINATOR: [
        'camp.message_templates.view',
        'camp.message_templates.create',
        'camp.message_templates.edit',
        'camp.message_templates.delete',
      ],
      COUNSELOR: ['camp.message_templates.view'],
      VIEWER: [],
    };
  }
}
