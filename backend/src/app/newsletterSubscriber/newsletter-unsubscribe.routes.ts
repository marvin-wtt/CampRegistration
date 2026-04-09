import { ModuleRouter } from '#core/router/ModuleRouter';
import { NewsletterSubscriberController } from './newsletter-subscriber.controller.js';
import { controller } from '#utils/bindController';
import { resolve } from '#core/ioc/container';

export class NewsletterUnsubscribeRouter extends ModuleRouter {
  constructor() {
    super(false);
  }

  protected registerBindings() {
    // No model bindings needed for the public unsubscribe endpoint
  }

  protected defineRoutes() {
    const subscriberController = resolve(NewsletterSubscriberController);

    // RFC 8058 one-click unsubscribe (used by email clients)
    this.router.post(
      '/:token',
      controller(subscriberController, 'unsubscribe'),
    );

    // User-initiated unsubscribe (used by the frontend)
    this.router.delete(
      '/:token',
      controller(subscriberController, 'unsubscribe'),
    );
  }
}
