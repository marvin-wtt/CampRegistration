import type { Request, Response } from 'express';
import validator from './message-template.validation.js';
import service from './message-template.service.js';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError.js';
import type {
  MessageTemplateCollection,
  MessageTemplateDefault,
  MessageTemplateDefaultResource,
  MessageTemplateResource,
} from '#app/messageTemplate/message-template.resource.js';
import { BaseController } from '#core/BaseController.js';
import defaultTemplates from '#assets/camp/messageTemplates';

class MessageTemplateController extends BaseController {
  async show(req: Request, res: Response) {
    await req.validate(validator.show);
    const template = req.modelOrFail('messageTemplate');

    res.status(httpStatus.OK).resource(new MessageTemplateResource(template));
  }

  async index(req: Request, res: Response) {
    const {
      params: { campId },
    } = await req.validate(validator.index);

    const templates = await service.queryMessageTemplates(campId);

    const defaults: MessageTemplateDefault[] = defaultTemplates.filter(
      ({ event }) => !templates.find((t) => t.event === event),
    );

    res
      .status(httpStatus.OK)
      .resource(
        new MessageTemplateCollection([
          ...MessageTemplateResource.collection(templates).entries(),
          ...MessageTemplateDefaultResource.collection(defaults).entries(),
        ]),
      );
  }

  async store(req: Request, res: Response) {
    const {
      params: { campId },
      body: { event, subject, body, priority },
    } = await req.validate(validator.store);

    // Duplicate events for the same camp are not allowed
    if (event) {
      const existing = await service.getMessageTemplateByName(event, campId);
      if (existing) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'Message template already exists',
        );
      }
    }

    const template = await service.createTemplate(campId, {
      event,
      subject,
      body,
      priority,
    });

    res
      .status(httpStatus.CREATED)
      .resource(new MessageTemplateResource(template));
  }

  async update(req: Request, res: Response) {
    const {
      params: { campId, messageTemplateId },
      body: { subject, body, priority },
    } = await req.validate(validator.update);

    const template = await service.updateMessageTemplate(
      messageTemplateId,
      campId,
      {
        subject,
        body,
        priority,
      },
    );

    res.status(httpStatus.OK).resource(new MessageTemplateResource(template));
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
