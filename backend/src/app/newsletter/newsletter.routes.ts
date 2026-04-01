import { auth, guard } from '#middlewares/index';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { NewsletterController } from './newsletter.controller.js';
import { NewsletterService } from './newsletter.service.js';
import { controller } from '#utils/bindController';
import { newsletterManager } from './newsletter.guard.js';
import { resolve } from '#core/ioc/container';
import type { NewsLetterQuery } from '@camp-registration/common/entities';

export class NewsletterRouter extends ModuleRouter {
  protected registerBindings() {
    const newsletterService = resolve(NewsletterService);
    this.bindModel('newsletter', (_req, id) =>
      newsletterService.getNewsletterById(id),
    );
  }

  protected defineRoutes() {
    const newsletterController = resolve(NewsletterController);

    this.router.use(auth());

    this.router.get(
      '/',
      guard((req) => (req.query as NewsLetterQuery).view !== 'all'),
      controller(newsletterController, 'index'),
    );
    this.router.get(
      '/:newsletterId',
      guard(newsletterManager),
      controller(newsletterController, 'show'),
    );
    this.router.post('/', controller(newsletterController, 'store'));
    this.router.patch(
      '/:newsletterId',
      guard(newsletterManager),
      controller(newsletterController, 'update'),
    );
    this.router.delete(
      '/:newsletterId',
      guard(newsletterManager),
      controller(newsletterController, 'destroy'),
    );
  }
}
