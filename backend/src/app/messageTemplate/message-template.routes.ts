import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import messageTemplateController from './message-template.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import service from '#app/messageTemplate/message-template.service';

export class MessageTemplateRouter extends ModuleRouter {
  protected registerBindings() {
    this.bindModel('messageTemplate', (req, id) => {
      const camp = req.modelOrFail('camp');
      return service.getMessageTemplateById(camp.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(campManager('camp.message_templates.view')),
      controller(messageTemplateController, 'index'),
    );
    this.router.get(
      '/:messageTemplateId',
      guard(campManager('camp.message_templates.view')),
      controller(messageTemplateController, 'show'),
    );
    this.router.post(
      '/',
      guard(campManager('camp.message_templates.create')),
      controller(messageTemplateController, 'store'),
    );
    this.router.patch(
      '/:messageTemplateId',
      guard(campManager('camp.message_templates.edit')),
      controller(messageTemplateController, 'update'),
    );
    this.router.delete(
      '/:messageTemplateId',
      guard(campManager('camp.message_templates.delete')),
      controller(messageTemplateController, 'destroy'),
    );
  }
}
