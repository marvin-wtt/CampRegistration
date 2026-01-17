import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
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
      const camp = req.modelOrFail('camp');
      return this.messageTemplateService.getMessageTemplateById(camp.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(campManager('camp.message_templates.view')),
      controller(this.messageTemplateController, 'index'),
    );
    this.router.get(
      '/:messageTemplateId',
      guard(campManager('camp.message_templates.view')),
      controller(this.messageTemplateController, 'show'),
    );
    this.router.post(
      '/',
      guard(campManager('camp.message_templates.create')),
      controller(this.messageTemplateController, 'store'),
    );
    this.router.patch(
      '/:messageTemplateId',
      guard(campManager('camp.message_templates.edit')),
      controller(this.messageTemplateController, 'update'),
    );
    this.router.delete(
      '/:messageTemplateId',
      guard(campManager('camp.message_templates.delete')),
      controller(this.messageTemplateController, 'destroy'),
    );
  }
}
