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

    // Public endpoint - no authentication required
    this.router.delete(
      '/:token',
      controller(subscriberController, 'unsubscribe'),
    );
  }
}
