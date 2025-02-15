import messageService from './message.service.js';
import httpStatus from 'http-status';
import { MessageResource } from './message.resource.js';
import registrationService from '#app/registration/registration.service';
import { BaseController } from '#core/controller/BaseController.js';
import type { Request, Response } from 'express';
import validator from '#app/message/message.validation';

class MessageController extends BaseController {
  async store(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const {
      body: {},
    } = await req.validate(validator.store);

    const message = await messageService.createMessage({});

    res.status(httpStatus.CREATED).resource(new MessageResource(message));
  }
}

export default new MessageController();
