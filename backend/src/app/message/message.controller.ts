import messageService from './message.service.js';
import httpStatus from 'http-status';
import { MessageResource } from './message.resource.js';
import registrationService from '#app/registration/registration.service';
import { BaseController } from '#core/controller/BaseController.js';
import type { Request, Response } from 'express';
import validator from '#app/message/message.validation';
import ApiError from '#utils/ApiError.js';

class MessageController extends BaseController {
  async index(req: Request, res: Response) {
    // TODO
  }

  async show(request: Request, response: Response): Promise<void> {
    // TODO
  }

  async store(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const { body } = await req.validate(validator.store);

    if ('event' in body) {
      const registration = await registrationService.getRegistrationById(
        camp.id,
        body.registrationId,
      );

      if (registration == null) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid registration id');
      }

      const message = await messageService.createEventMessage(
        body.event,
        camp,
        registration,
      );

      res.status(httpStatus.CREATED).resource(new MessageResource(message));
      return;
    } else {
      // TODO
    }
  }

  async resend(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const message = req.modelOrFail('message');
    await req.validate(validator.resend);

    // TODO

    res.status(httpStatus.CREATED).resource(new MessageResource(message));
  }

  async destroy(req: Request, res: Response) {
    // TODO
  }
}

export default new MessageController();
