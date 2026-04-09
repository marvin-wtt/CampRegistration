import { auth, guard } from '#middlewares/index';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { NewsletterController } from './newsletter.controller.js';
import { NewsletterService } from './newsletter.service.js';
import { controller } from '#utils/bindController';
import { newsletterManager } from './newsletter.guard.js';
import { resolve } from '#core/ioc/container';
import type { NewsletterQuery } from '@camp-registration/common/entities';

export class NewsletterRouter extends ModuleRouter {
  protected registerBindings() {
    const newsletterService = resolve(NewsletterService);
    this.bindModel('newsletter', (_req, id) =>
      newsletterService.getNewsletterById(id),
    );
  }

  protected defineRoutes() {
    const newsletterController = resolve(NewsletterController);

    this.router.get(
      '/',
      auth(),
      guard((req) => (req.query as NewsletterQuery).view !== 'all'),
      controller(newsletterController, 'index'),
    );
    this.router.get(
      '/:newsletterId',
      auth(),
      guard(newsletterManager),
      controller(newsletterController, 'show'),
    );
    this.router.post('/', auth(), controller(newsletterController, 'store'));
    this.router.patch(
      '/:newsletterId',
      auth(),
      guard(newsletterManager),
      controller(newsletterController, 'update'),
    );
    this.router.delete(
      '/:newsletterId',
      auth(),
      guard(newsletterManager),
      controller(newsletterController, 'destroy'),
    );
  }
}
