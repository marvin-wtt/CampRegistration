import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
  BindOptions,
} from '#core/base/AppModule';
import { MessageRouter } from '#app/message/message.routes';
import type { MessagePermission } from '@camp-registration/common/permissions';
import { registerFileGuard } from '#app/file/file.guard';
import { messageFileGuard } from '#app/message/message.guard';
import { MessageService } from '#app/message/message.service';
import { MessageController } from '#app/message/message.controller';

export class MessageModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(MessageService).toSelf().inSingletonScope();
    options.bind(MessageController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    registerFileGuard('message', messageFileGuard);

    router.useRouter('/camps/:campId/messages', new MessageRouter());
  }

  registerPermissions(): RoleToPermissions<MessagePermission> {
    return {
      DIRECTOR: [
        'camp.messages.view',
        'camp.messages.create',
        'camp.messages.delete',
      ],
      COORDINATOR: [
        'camp.messages.view',
        'camp.messages.create',
        'camp.messages.delete',
      ],
      COUNSELOR: [],
      VIEWER: [],
    };
  }
}
