import { auth, guard } from '#middlewares/index';
import { hasEventPermission } from '#app/event/event.guard';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { MessageDeliveryController } from '#app/messageDelivery/message-delivery.controller';
import { resolve } from '#core/ioc/container';

/**
 * Mounted at `/events/:eventId/registrations/:registrationId/messages` — the
 * emails a registration received, manual and automated. Reuses the global
 * `event` / `registration` bindings. The rendered bodies are message content,
 * so this sits behind the same permission as the messages themselves.
 */
export class RegistrationMessageRouter extends ModuleRouter {
  protected registerBindings() {
    // Reuses the global `event` / `registration` bindings.
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
