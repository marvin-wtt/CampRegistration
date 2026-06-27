import type { AppModule, BindOptions } from '#core/base/AppModule';
import { registerFileGuard } from '#app/file/file.guard';
import { messageDeliveryFileGuard } from '#app/messageDelivery/message-delivery.guard';

export class MessageDeliveryModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(MessageDeliveryModule).toSelf().inSingletonScope();
  }

  registerRoutes() {
    registerFileGuard('messageDelivery', {
      view: messageDeliveryFileGuard,
    });
  }
}
