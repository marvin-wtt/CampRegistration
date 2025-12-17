import messageService from './message.service.js';
import httpStatus from 'http-status';
import registrationService from '#app/registration/registration.service';
import { BaseController } from '#core/base/BaseController';
import type { Request, Response } from 'express';
import validator from '#app/message/message.validation';
import messageTemplateService from '#app/messageTemplate/message-template.service';
import ApiError from '#utils/ApiError';
import { RegistrationTemplateMessage } from '#app/registration/registration.messages';
import { MessageTemplateResource } from '#app/messageTemplate/message-template.resource';

class MessageController extends BaseController {
  index(_req: Request, res: Response) {
    res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  }

  show(_req: Request, res: Response) {
    res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  }

  async store(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const { body } = await req.validate(validator.store);

    const registrations = await registrationService.getRegistrationsByIds(
      camp.id,
      body.registrationIds,
    );

    // Throw error if not all ids were found
    if (registrations.length !== body.registrationIds.length) {
      const missingIds = body.registrationIds.filter(
        (id) => !registrations.some((registration) => registration.id === id),
      );

      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid registration id(s): [${missingIds.join(', ')}]`,
      );
    }

    const template = await messageTemplateService.createTemplate(camp.id, {
      subject: body.subject,
      body: body.body,
      priority: body.priority,
      replyTo: body.replyTo,
    });

    registrations.forEach((registration) => {
      RegistrationTemplateMessage.enqueue({
        camp,
        registration,
        messageTemplate: template,
      });
    });

    res
      .status(httpStatus.CREATED)
      .resource(new MessageTemplateResource(template));
  }

  async resend(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const requestMessage = req.modelOrFail('message');
    await req.validate(validator.resend);

    // TODO Enqueue message instead
    await messageService.resendMessage(camp, requestMessage);

    res.sendStatus(httpStatus.CREATED);
  }

  destroy(_req: Request, res: Response) {
    res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  }
}

export default new MessageController();
