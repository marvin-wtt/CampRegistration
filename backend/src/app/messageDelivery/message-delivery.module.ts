import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { registerFileGuard } from '#app/file/file.guard';
import { messageDeliveryFileGuard } from '#app/messageDelivery/message-delivery.guard';
import { MessageDeliveryService } from '#app/messageDelivery/message-delivery.service';
import { MessageDeliveryController } from '#app/messageDelivery/message-delivery.controller';
import { RegistrationMessageRouter } from '#app/messageDelivery/message-delivery.routes';
import { processBounceResults } from '#app/messageDelivery/message-bounce-notifier';
import { MailService } from '#core/mail/mail.service';
import { resolve } from '#core/ioc/container';

export class MessageDeliveryModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(MessageDeliveryService).toSelf().inSingletonScope();
    options.bind(MessageDeliveryController).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter) {
    router.useRouter(
      '/events/:eventId/registrations/:registrationId/messages',
      new RegistrationMessageRouter(),
    );
    registerFileGuard('messageDelivery', {
      view: messageDeliveryFileGuard,
    });
  }

  configure(): void {
    // MailModule decides how the active driver detects bounces (poll vs.
    // webhook); this module only supplies what happens once one is found.
    resolve(MailService).onBounce(processBounceResults);
  }
}
