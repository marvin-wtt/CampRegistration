import type { Request, Response } from 'express';
import validator from './message-template.validation.js';
import service from './message-template.service.js';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError.js';

class MessageTemplateController {
  async show(req: Request, res: Response) {
    const {} = await req.validate(validator.show);
    // TODO
    res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  }

  async index(req: Request, res: Response) {
    const {} = await req.validate(validator.index);
    // TODO
    res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  }

  async store(req: Request, res: Response) {
    const {
      params: { campId },
      body: { name, subject, body, priority },
    } = await req.validate(validator.store);

    const existing = await service.getMessageTemplateByName(name, campId);
    if (existing) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Message template already exists',
      );
    }

    const template = await service.createTemplate(campId, {
      name,
      subject,
      body,
      priority,
    });

    // TODO Use resource
    res.status(httpStatus.CREATED).json(template);
  }

  async update(req: Request, res: Response) {
    const {} = await req.validate(validator.update);
    // TODO
    res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { messageTemplateId, campId },
    } = await req.validate(validator.destroy);

    await service.deleteMessageTemplateById(messageTemplateId, campId);

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}

export default new MessageTemplateController();
