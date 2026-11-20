import { ModuleRouter } from '#core/router/ModuleRouter';
import { NewsletterSubscriberController } from './newsletter-subscriber.controller.js';
import { controller } from '#core/router/bindController';
import { resolve } from '#core/ioc/container';

export class NewsletterConfirmRouter extends ModuleRouter {
  constructor() {
    super(false);
  }

  protected registerBindings() {
    // The token identifies the subscriber; no model bindings needed
  }

  protected defineRoutes() {
    const subscriberController = resolve(NewsletterSubscriberController);

    // Reading never confirms, so link scanners opening the URL change nothing
    this.router.get(
      '/:token',
      controller(subscriberController, 'showConfirmation'),
    );
    this.router.post('/:token', controller(subscriberController, 'confirm'));
  }
}
