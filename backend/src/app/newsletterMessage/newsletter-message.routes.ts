import { auth, guard } from '#middlewares/index';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { NewsletterMessageController } from './newsletter-message.controller.js';
import { NewsletterMessageService } from './newsletter-message.service.js';
import { controller } from '#utils/bindController';
import { newsletterManager } from '#app/newsletter/newsletter.guard';
import { resolve } from '#core/ioc/container';

export class NewsletterMessageRouter extends ModuleRouter {
  protected registerBindings() {
    const messageService = resolve(NewsletterMessageService);
    this.bindModel('newsletterMessage', (req, id) => {
      const newsletter = req.modelOrFail('newsletter');
      return messageService.getMessageById(newsletter.id, id);
    });
  }

  protected defineRoutes() {
    const messageController = resolve(NewsletterMessageController);

    this.router.use(auth());
    this.router.use(guard(newsletterManager));

    this.router.get('/', controller(messageController, 'index'));
    this.router.post('/', controller(messageController, 'store'));
    this.router.delete(
      '/:newsletterMessageId',
      controller(messageController, 'destroy'),
    );
  }
}
