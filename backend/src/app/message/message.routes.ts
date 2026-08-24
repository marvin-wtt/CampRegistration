import { auth, guard, multipart } from '#middlewares/index';
import { hasEventPermission } from '#app/event/event.guard';
import { MessageController } from './message.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { MessageService } from '#app/message/message.service';
import { resolve } from '#core/ioc/container';

export class MessageRouter extends ModuleRouter {
  protected registerBindings() {
    const messageService = resolve(MessageService);
    this.bindModel('message', (req, id) => {
      const event = req.model('event');
      if (!event) {
        return null;
      }
      return messageService.getMessageById(event.id, id);
    });
  }

  protected defineRoutes() {
    const messageController: MessageController = resolve(MessageController);

    this.router.use(auth());

    this.router.get(
      '/',
      guard(hasEventPermission('event.messages.view')),
      controller(messageController, 'index'),
    );
    this.router.get(
      '/:messageId',
      guard(hasEventPermission('event.messages.view')),
      controller(messageController, 'show'),
    );
    this.router.post(
      '/',
      guard(hasEventPermission('event.messages.create')),
      multipart({ name: 'attachments' }),
      controller(messageController, 'store'),
    );
    this.router.post(
      '/:messageId/resend',
      guard(hasEventPermission('event.messages.create')),
      controller(messageController, 'resend'),
    );
    this.router.delete(
      '/:messageId',
      guard(hasEventPermission('event.messages.delete')),
      controller(messageController, 'destroy'),
    );
    this.router.post(
      '/:messageId/attachments',
      guard(hasEventPermission('event.messages.create')),
      controller(messageController, 'duplicateAttachments'),
    );
  }
}
