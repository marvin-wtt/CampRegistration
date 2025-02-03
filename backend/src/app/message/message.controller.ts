import messageService from './message.service.js';
import httpStatus from 'http-status';
import { MessageResource } from './message.resource.js';
import registrationService from '#app/registration/registration.service';
import { BaseController } from '#core/controller/BaseController.js';
import type { Request, Response } from 'express';

class MessageController extends BaseController {
  async store(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const { body } = await req.validate();

    const registrations = await registrationService.queryRegistrationsByIds(
      body.registrations,
    );
    const messageData = registrations.map((registration) => {
      const recipients =
        registrationService.extractRegistrationEmails(registration);

      return {
        recipients,
        replyTo: body.replyTo,
        subject: body.subject,
        body: body.body,
        priority: body.priority,
        context: {
          camp,
        },
        locale: registration.locale,
        registrationId: registration.id,
        attachments: undefined,
      };
    });

    const message = await messageService.sendMessage({
      recipients: '',
      replyTo: body.replyTo,
      subject: body.subject,
      body: body.body,
      priority: body.priority,
      context: {
        camp,
      },
      locale: undefined,
      registrationId: undefined,
      attachments: undefined,
    });

    res.status(httpStatus.CREATED).resource(new MessageResource(message));
  }
}

export default new MessageController();
