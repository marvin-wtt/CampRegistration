import httpStatus from 'http-status';
import { NewsletterService } from './newsletter.service.js';
import { NewsletterResource } from './newsletter.resource.js';
import { NewsletterMessageService } from '#app/newsletterMessage/newsletter-message.service';
import { NewsletterSubscriberService } from '#app/newsletterSubscriber/newsletter-subscriber.service';
import { NewsletterMail } from './newsletter.mail.js';
import validator from './newsletter.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';

@injectable()
export class NewsletterController extends BaseController {
  constructor(
    @inject(NewsletterService)
    private readonly newsletterService: NewsletterService,
    @inject(NewsletterSubscriberService)
    private readonly subscriberService: NewsletterSubscriberService,
    @inject(NewsletterMessageService)
    private readonly messageService: NewsletterMessageService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const { query } = await req.validate(validator.index);
    const userId = req.authUserId();

    const newsletters =
      query?.view === 'all'
        ? await this.newsletterService.getAllNewsletters()
        : await this.newsletterService.getNewslettersByUserId(userId);

    res.resource(NewsletterResource.collection(newsletters));
  }

  async show(req: Request, res: Response) {
    await req.validate(validator.show);
    const newsletter = req.modelOrFail('newsletter');

    res.resource(new NewsletterResource(newsletter));
  }

  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const userId = req.authUserId();

    const newsletter = await this.newsletterService.createNewsletter(userId, {
      name: body.name,
      description: body.description,
    });

    res.status(httpStatus.CREATED).resource(new NewsletterResource(newsletter));
  }

  async update(req: Request, res: Response) {
    const newsletter = req.modelOrFail('newsletter');
    const { body } = await req.validate(validator.update);

    const updated = await this.newsletterService.updateNewsletter(
      newsletter.id,
      {
        name: body.name,
        description: body.description,
      },
    );

    res.resource(new NewsletterResource(updated));
  }

  async destroy(req: Request, res: Response) {
    const newsletter = req.modelOrFail('newsletter');
    await req.validate(validator.destroy);

    await this.newsletterService.deleteNewsletter(newsletter.id);

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async send(req: Request, res: Response) {
    const newsletter = req.modelOrFail('newsletter');
    const { body } = await req.validate(validator.send);

    const subscribers = await this.subscriberService.getSubscribers(
      newsletter.id,
    );

    for (const subscriber of subscribers) {
      await NewsletterMail.enqueue({
        to: subscriber.email,
        name: subscriber.name,
        subject: body.subject,
        body: body.body,
        newsletterId: newsletter.id,
        unsubscribeToken: subscriber.unsubscribeToken,
      });
    }

    await this.messageService.recordMessage(newsletter.id, {
      subject: body.subject,
      body: body.body,
      recipientCount: subscribers.length,
    });

    res.json({ data: { queued: subscribers.length } });
  }
}
