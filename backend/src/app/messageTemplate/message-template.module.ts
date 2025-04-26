import type {
  AppModule,
  ModuleOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import messageTemplateRoutes from '#app/messageTemplate/message-template.routes';
import { registerRouteModelBinding } from '#core/router';
import service from '#app/messageTemplate/message-template.service';
import type { MessageTemplatePermission } from '@camp-registration/common/permissions';

export class MessageTemplateModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('messageTemplate', (req, id) => {
      const camp = req.modelOrFail('camp');
      return service.getMessageTemplateById(camp.id, id);
    });

    router.use('/camps/:campId/message-templates', messageTemplateRoutes);
  }

  registerPermissions(): RoleToPermissions<MessageTemplatePermission> {
    return {
      DIRECTOR: [
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
