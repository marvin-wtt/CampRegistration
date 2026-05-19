import { auth, guard } from '#middlewares/index';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { NewsletterSubscriberController } from './newsletter-subscriber.controller.js';
import { NewsletterSubscriberService } from './newsletter-subscriber.service.js';
import { controller } from '#utils/bindController';
import { newsletterManager } from '#app/newsletter/newsletter.guard';
import { resolve } from '#core/ioc/container';

export class NewsletterSubscriberRouter extends ModuleRouter {
  protected registerBindings() {
    const subscriberService = resolve(NewsletterSubscriberService);
    this.bindModel('newsletterSubscriber', (req, id) => {
      const newsletter = req.model('newsletter');
      if (!newsletter) {
        return null;
      }

      return subscriberService.getSubscriberById(newsletter.id, id);
    });
  }

  protected defineRoutes() {
    const subscriberController = resolve(NewsletterSubscriberController);

    this.router.get(
      '/',
      auth(),
      guard(newsletterManager),
      controller(subscriberController, 'index'),
    );
    this.router.post(
      '/',
      auth(),
      guard(newsletterManager),
      controller(subscriberController, 'store'),
    );
    this.router.post(
      '/import',
      auth(),
      guard(newsletterManager),
      controller(subscriberController, 'importFromCamp'),
    );
    this.router.delete(
      '/:newsletterSubscriberId',
      auth(),
      guard(newsletterManager),
      controller(subscriberController, 'destroy'),
    );
  }
}
