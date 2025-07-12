import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
} from '#core/base/AppModule';
import { MessageTemplateRouter } from '#app/messageTemplate/message-template.routes';
import type { MessageTemplatePermission } from '@camp-registration/common/permissions';
import { registerFileGuard } from '#app/file/file.guard';
import { messageTemplateFileGuard } from '#app/messageTemplate/message-template.guard';

export class MessageTemplateModule implements AppModule {
  registerRoutes(router: AppRouter): void {
    registerFileGuard('messageTemplate', messageTemplateFileGuard);

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
