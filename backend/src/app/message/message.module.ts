import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import messageRoutes from '#app/message/message.routes';

export class MessageModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    router.use('/:campId/messages', messageRoutes);
  }
}
