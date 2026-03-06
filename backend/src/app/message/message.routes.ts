import { auth, guard, multipart } from '#middlewares/index';
import { campManager } from '#guards/index';
import { MessageController } from './message.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { MessageService } from '#app/message/message.service';
import { resolve } from '#core/ioc/container';

export class MessageRouter extends ModuleRouter {
  protected registerBindings() {
    const messageService = resolve(MessageService);
    this.bindModel('message', (req, id) => {
      const camp = req.modelOrFail('camp');
      return messageService.getMessageById(camp.id, id);
    });
  }

  protected defineRoutes() {
    const messageController = resolve(MessageController);

    this.router.use(auth());

    this.router.get(
      '/',
      guard(campManager('camp.messages.view')),
      controller(messageController, 'index'),
    );
    this.router.get(
      '/:messageId',
      guard(campManager('camp.messages.view')),
      controller(messageController, 'show'),
    );
    this.router.post(
      '/',
      guard(campManager('camp.messages.create')),
      multipart({ name: 'attachments' }),
      controller(messageController, 'store'),
    );
    this.router.post(
      '/:messageId/resend',
      guard(campManager('camp.messages.create')),
      controller(messageController, 'resend'),
    );
    this.router.delete(
      '/:messageId',
      guard(campManager('camp.messages.delete')),
      controller(messageController, 'destroy'),
    );
  }
}
