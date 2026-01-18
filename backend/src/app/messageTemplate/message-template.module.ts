import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
  BindOptions,
} from '#core/base/AppModule';
import { MessageTemplateRouter } from '#app/messageTemplate/message-template.routes';
import type { MessageTemplatePermission } from '@camp-registration/common/permissions';
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
    registerFileGuard('messageTemplate', messageTemplateFileGuard);

    router.useRouter(
      '/camps/:campId/message-templates',
      resolve(MessageTemplateRouter),
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
