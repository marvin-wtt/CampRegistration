import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { NewsletterSubscriberService } from './newsletter-subscriber.service.js';
import { NewsletterSubscriberResource } from './newsletter-subscriber.resource.js';
import validator from './newsletter-subscriber.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';
import { EventManagerService } from '#app/eventManager/event-manager.service';

@injectable()
export class NewsletterSubscriberController extends BaseController {
  constructor(
    @inject(NewsletterSubscriberService)
    private readonly subscriberService: NewsletterSubscriberService,
    @inject(EventManagerService)
    private readonly eventManagerService: EventManagerService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const newsletter = req.modelOrFail('newsletter');
    await req.validate(validator.index);

    const subscribers = await this.subscriberService.getSubscribers(
      newsletter.id,
    );

    res.resource(NewsletterSubscriberResource.collection(subscribers));
  }

  async store(req: Request, res: Response) {
    const newsletter = req.modelOrFail('newsletter');
    const { body } = await req.validate(validator.store);

    const existing = await this.subscriberService.getSubscriberByEmail(
      newsletter.id,
      body.email,
    );

    if (existing) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'This email address is already subscribed.',
      );
    }

    const subscriber = await this.subscriberService.createSubscriber(
      newsletter.id,
      {
        email: body.email,
        name: body.name,
      },
    );

    res
      .status(httpStatus.CREATED)
      .resource(new NewsletterSubscriberResource(subscriber));
  }

  async importFromEvent(req: Request, res: Response) {
    const newsletter = req.modelOrFail('newsletter');
    const userId = req.authUserId();
    const { body } = await req.validate(validator.importFromEvent);

    const canViewRegistrations =
      await this.eventManagerService.eventManagerHasPermission(
        body.eventId,
        userId,
        'event.registrations.view',
      );
    if (!canViewRegistrations) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'You are not allowed to import subscribers from this event.',
      );
    }

    const result = await this.subscriberService.importSubscribersFromEvent(
      newsletter.id,
      body.eventId,
      body.country,
      body.requireConsent,
    );

    res.json({ data: result });
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const subscriber = req.modelOrFail('newsletterSubscriber');

    await this.subscriberService.removeSubscriber(subscriber.id);

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async unsubscribe(req: Request, res: Response) {
    const {
      params: { token },
    } = await req.validate(validator.unsubscribe);

    const subscriber = await this.subscriberService.getSubscriberByToken(token);
    if (!subscriber) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Invalid or expired unsubscribe link.',
      );
    }

    await this.subscriberService.unsubscribeByToken(token);

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}
