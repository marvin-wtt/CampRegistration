import { auth, guard } from '#middlewares/index';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { NewsletterManagerController } from './newsletter-manager.controller.js';
import { NewsletterManagerService } from './newsletter-manager.service.js';
import { controller } from '#utils/bindController';
import { newsletterManager } from './newsletter.guard.js';
import { resolve } from '#core/ioc/container';

export class NewsletterManagerRouter extends ModuleRouter {
  constructor() {
    super(false);
  }

  protected registerBindings() {
    const managerService = resolve(NewsletterManagerService);
    this.bindModel('newsletterManager', (req, id) => {
      const newsletter = req.modelOrFail('newsletter');
      return managerService.getManagerById(newsletter.id, id);
    });
  }

  protected defineRoutes() {
    const managerController = resolve(NewsletterManagerController);

    this.router.use(auth());
    this.router.use(guard(newsletterManager));

    this.router.get('/', controller(managerController, 'index'));
    this.router.post('/', controller(managerController, 'store'));
    this.router.delete(
      '/:newsletterManagerId',
      controller(managerController, 'destroy'),
    );
  }
}
