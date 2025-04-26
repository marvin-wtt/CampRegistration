import type {
  AppModule,
  ModuleOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import messageRoutes from '#app/message/message.routes';
import { registerRouteModelBinding } from '#core/router';
import messageService from '#app/message/message.service';
import type { MessagePermission } from '@camp-registration/common/permissions';

export class MessageModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('message', (req, id) => {
      const camp = req.modelOrFail('camp');
      return messageService.getMessageById(camp.id, id);
    });

    router.use('/camps/:campId/messages', messageRoutes);
  }

  registerPermissions(): RoleToPermissions<MessagePermission> {
    return {
      DIRECTOR: [
        'camp.messages.view',
        'camp.messages.create',
        'camp.messages.delete',
      ],
      COUNSELOR: [],
      VIEWER: [],
    };
  }
}
