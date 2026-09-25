import { auth, guard } from '#middlewares/index';
import { hasEventPermission } from '#app/event/event.guard';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { MessageDeliveryController } from '#app/messageDelivery/message-delivery.controller';
import { resolve } from '#core/ioc/container';

// The emails a registration received, behind the messages' own permission.
export class RegistrationMessageRouter extends ModuleRouter {
  protected registerBindings() {
    // `event` and `registration` are bound globally.
  }

  protected defineRoutes() {
    const deliveryController = resolve(MessageDeliveryController);

    this.router.get(
      '/',
      auth(),
      guard(hasEventPermission('event.messages.view')),
      controller(deliveryController, 'indexForRegistration'),
    );
  }
}
