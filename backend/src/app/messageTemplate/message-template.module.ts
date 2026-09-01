import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { MessageTemplateRouter } from '#app/messageTemplate/message-template.routes';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { registerFileGuard } from '#app/file/file.guard';
import { messageTemplateFileGuard } from '#app/messageTemplate/message-template.guard';
import { resolve } from '#core/ioc/container';
import { MessageTemplateService } from '#app/messageTemplate/message-template.service';
import { MessageTemplateController } from '#app/messageTemplate/message-template.controller';

export class MessageTemplateModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(MessageTemplateService).toSelf().inSingletonScope();
    options.bind(MessageTemplateController).toSelf().inSingletonScope();
    options.bind(MessageTemplateRouter).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    registerFileGuard('messageTemplate', {
      view: messageTemplateFileGuard,
    });

    router.useRouter(
      '/events/:eventId/message-templates',
      resolve(MessageTemplateRouter),
    );
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.message_templates.view',
          'event.message_templates.create',
          'event.message_templates.edit',
          'event.message_templates.delete',
        ],
        COORDINATOR: [
          'event.message_templates.view',
          'event.message_templates.create',
          'event.message_templates.edit',
          'event.message_templates.delete',
        ],
        COUNSELOR: ['event.message_templates.view'],
        VIEWER: [],
      },
    };
  }
}
