import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import messageTemplateRoutes from '#app/messageTemplate/message-template.routes';

export class MessageTemplateModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    router.use('/camps/:campId/message-templates', messageTemplateRoutes);
  }
}
