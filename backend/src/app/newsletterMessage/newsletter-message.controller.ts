import httpStatus from 'http-status';
import { NewsletterMessageService } from './newsletter-message.service.js';
import { NewsletterMessageResource } from './newsletter-message.resource.js';
import validator from './newsletter-message.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';

@injectable()
export class NewsletterMessageController extends BaseController {
  constructor(
    @inject(NewsletterMessageService)
    private readonly messageService: NewsletterMessageService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const newsletter = req.modelOrFail('newsletter');
    await req.validate(validator.index);

    const messages = await this.messageService.getMessages(newsletter.id);

    res.resource(NewsletterMessageResource.collection(messages));
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const message = req.modelOrFail('message');

    await this.messageService.deleteMessage(message.id);

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}
