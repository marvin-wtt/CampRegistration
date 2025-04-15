import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import messageRoutes from '#app/message/message.routes';
import { registerRouteModelBinding } from '#core/router';
import messageService from '#app/message/message.service';

export class MessageModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('message', (req, id) => {
      const camp = req.modelOrFail('camp');
      return messageService.getMessageById(camp.id, id);
    });

    router.use('/camps/:campId/messages', messageRoutes);
  }
}
