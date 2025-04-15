import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import messageTemplateRoutes from '#app/messageTemplate/message-template.routes';
import { registerRouteModelBinding } from '#core/router.';
import service from '#app/messageTemplate/message-template.service';

export class MessageTemplateModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('messageTemplate', (req, id) => {
      const camp = req.modelOrFail('camp');
      return service.getMessageTemplateById(camp.id, id);
    });

    router.use('/camps/:campId/message-templates', messageTemplateRoutes);
  }
}
