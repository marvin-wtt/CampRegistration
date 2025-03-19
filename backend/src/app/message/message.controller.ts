import messageService from './message.service.js';
import httpStatus from 'http-status';
import { MessageResource, type MessageWithFiles } from './message.resource.js';
import registrationService from '#app/registration/registration.service';
import { BaseController } from '#core/BaseController.js';
import type { Request, Response } from 'express';
import validator from '#app/message/message.validation';
import messageTemplateService from '#app/messageTemplate/message-template.service.js';

class MessageController extends BaseController {
  index(_req: Request, res: Response) {
    res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  }

  show(_req: Request, res: Response): Promise<void> {
    res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  }

  async store(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const { body } = await req.validate(validator.store);

    const registrations = await registrationService.getRegistrationsByIds(
      camp.id,
      body.registrationIds,
    );

    const template = await messageTemplateService.createTemplate(camp.id, {
      subject: body.subject,
      body: body.body,
      priority: body.priority,
      replyTo: body.replyTo,
    });

    const messages: MessageWithFiles[] = await Promise.all(
      registrations.map((registration) =>
        messageService.sendTemplateMessage(template, camp, registration),
      ),
    );

    res
      .status(httpStatus.CREATED)
      .resource(MessageResource.collection(messages));
  }

  async resend(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const requestMessage = req.modelOrFail('message');
    await req.validate(validator.resend);

    const message = await messageService.resendMessage(camp, requestMessage);

    res.status(httpStatus.CREATED).resource(new MessageResource(message));
  }

  destroy(_req: Request, res: Response) {
    res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  }
}

export default new MessageController();
