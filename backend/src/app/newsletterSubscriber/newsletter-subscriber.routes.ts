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
    this.bindModel('subscriber', (req, id) => {
      const newsletter = req.modelOrFail('newsletter');
      return subscriberService.getSubscriberById(newsletter.id, id);
    });
  }

  protected defineRoutes() {
    const subscriberController = resolve(NewsletterSubscriberController);

    this.router.use(auth());
    this.router.use(guard(newsletterManager));

    this.router.get('/', controller(subscriberController, 'index'));
    this.router.post('/', controller(subscriberController, 'store'));
    this.router.post(
      '/import',
      controller(subscriberController, 'importFromCamp'),
    );
    this.router.delete(
      '/:subscriberId',
      controller(subscriberController, 'destroy'),
    );
  }
}
