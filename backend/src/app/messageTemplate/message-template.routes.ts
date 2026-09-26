import { auth, guard, multipart } from '#middlewares/index';
import { hasEventPermission } from '#app/event/event.guard';
import { MessageTemplateController } from './message-template.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { MessageTemplateService } from '#app/messageTemplate/message-template.service';
import { inject, injectable } from 'inversify';

@injectable()
export class MessageTemplateRouter extends ModuleRouter {
  constructor(
    @inject(MessageTemplateService)
    private readonly messageTemplateService: MessageTemplateService,
    @inject(MessageTemplateController)
    private readonly messageTemplateController: MessageTemplateController,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel('messageTemplate', (req, id) => {
      const event = req.model('event');
      if (!event) {
        return null;
      }
      return this.messageTemplateService.getMessageTemplateById(event.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(hasEventPermission('event.message_templates.view')),
      controller(this.messageTemplateController, 'index'),
    );
    this.router.get(
      '/:messageTemplateId',
      guard(hasEventPermission('event.message_templates.view')),
      controller(this.messageTemplateController, 'show'),
    );
    this.router.post(
      '/',
      guard(hasEventPermission('event.message_templates.create')),
      multipart({ name: 'attachments' }),
      controller(this.messageTemplateController, 'store'),
    );
    this.router.patch(
      '/:messageTemplateId',
      guard(hasEventPermission('event.message_templates.edit')),
      controller(this.messageTemplateController, 'update'),
    );
    this.router.delete(
      '/:messageTemplateId',
      guard(hasEventPermission('event.message_templates.delete')),
      controller(this.messageTemplateController, 'destroy'),
    );
  }
}
