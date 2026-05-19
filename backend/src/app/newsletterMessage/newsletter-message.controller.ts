import httpStatus from 'http-status';
import { NewsletterMessageService } from './newsletter-message.service.js';
import { NewsletterMessageResource } from './newsletter-message.resource.js';
import validator from './newsletter-message.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';
import { NewsletterSubscriberService } from '#app/newsletterSubscriber/newsletter-subscriber.service';
import { NewsletterMessageMail } from './newsletter-message.mail.js';

@injectable()
export class NewsletterMessageController extends BaseController {
  constructor(
    @inject(NewsletterMessageService)
    private readonly messageService: NewsletterMessageService,
    @inject(NewsletterSubscriberService)
    private readonly subscriberService: NewsletterSubscriberService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const newsletter = req.modelOrFail('newsletter');
    await req.validate(validator.index);

    const messages = await this.messageService.getMessages(newsletter.id);

    res.resource(NewsletterMessageResource.collection(messages));
  }

  async store(req: Request, res: Response) {
    const newsletter = req.modelOrFail('newsletter');
    const { body } = await req.validate(validator.store);
    const userId = req.authUserId();

    const subscribers = await this.subscriberService.getSubscribers(
      newsletter.id,
    );

    const message = await this.messageService.storeMessage(newsletter.id, {
      subject: body.subject,
      body: body.body,
      recipientCount: subscribers.length,
      sentByUserId: userId,
      attachmentIds: body.attachmentIds,
      sessionId: req.sessionId,
    });

    await NewsletterMessageMail.enqueueBulk(
      subscribers.map((subscriber) => ({
        to: subscriber.email,
        name: subscriber.name,
        subject: body.subject,
        body: body.body,
        replyTo: newsletter.replyTo ?? undefined,
        newsletterId: newsletter.id,
        unsubscribeToken: subscriber.unsubscribeToken,
        attachments: message.attachments,
      })),
    );

    res
      .status(httpStatus.CREATED)
      .resource(new NewsletterMessageResource(message));
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const message = req.modelOrFail('newsletterMessage');

    await this.messageService.deleteMessage(message.id);

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}
