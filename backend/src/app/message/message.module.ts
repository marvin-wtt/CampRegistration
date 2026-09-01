import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { MessageRouter } from '#app/message/message.routes';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
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
    registerFileGuard('message', {
      view: messageFileGuard,
    });

    router.useRouter('/events/:eventId/messages', new MessageRouter());
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.messages.view',
          'event.messages.create',
          'event.messages.delete',
        ],
        COORDINATOR: [
          'event.messages.view',
          'event.messages.create',
          'event.messages.delete',
        ],
        COUNSELOR: [],
        VIEWER: [],
      },
    };
  }
}
