import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
} from '#core/base/AppModule';
import { MessageRouter } from '#app/message/message.routes';
import type { MessagePermission } from '@camp-registration/common/permissions';

export class MessageModule implements AppModule {
  registerRoutes(router: AppRouter): void {
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
