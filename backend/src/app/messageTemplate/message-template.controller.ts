import type { Request, Response } from 'express';
import validator from './message-template.validation.js';
import { MessageTemplateService } from './message-template.service.js';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import {
  MessageTemplateCollection,
  type MessageTemplateDefault,
  MessageTemplateDefaultResource,
  MessageTemplateResource,
} from '#app/messageTemplate/message-template.resource';
import { BaseController } from '#core/base/BaseController';
import defaultTemplates from '#assets/camp/messageTemplates';
import { inject, injectable } from 'inversify';

@injectable()
export class MessageTemplateController extends BaseController {
  constructor(
    @inject(MessageTemplateService)
    private readonly messageTemplateService: MessageTemplateService,
  ) {
    super();
  }

  async show(req: Request, res: Response) {
    await req.validate(validator.show);
    const template = req.modelOrFail('messageTemplate');

    res.status(httpStatus.OK).resource(new MessageTemplateResource(template));
  }

  async index(req: Request, res: Response) {
    const {
      params: { campId },
      query: { includeDefaults, hasEvent },
    } = await req.validate(validator.index);

    let templates =
      await this.messageTemplateService.queryMessageTemplates(campId);

    if (hasEvent) {
      templates = templates.filter((template) => !!template.event === hasEvent);
    }

    const defaults: MessageTemplateDefault[] =
      includeDefaults === true
        ? defaultTemplates.filter(
            ({ event }) => !templates.find((t) => t.event === event),
          )
        : [];

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
      const existing =
        await this.messageTemplateService.getMessageTemplateByName(
          event,
          campId,
        );
      if (existing) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'Message template already exists',
        );
      }
    }

    const template = await this.messageTemplateService.createTemplate(campId, {
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

    const template = await this.messageTemplateService.updateMessageTemplate(
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

    await this.messageTemplateService.deleteMessageTemplateById(
      messageTemplateId,
      campId,
    );

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}
