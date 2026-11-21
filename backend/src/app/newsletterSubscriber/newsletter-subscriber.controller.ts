import ApiError from '#core/router/ApiError';
import httpStatus from 'http-status';
import { NewsletterSubscriberService } from './newsletter-subscriber.service.js';
import { NewsletterSubscriberResource } from './newsletter-subscriber.resource.js';
import {
  NewsletterConfirmationMail,
  type NewsletterConfirmationMailPayload,
} from './newsletter-subscriber.mail.js';
import validator from './newsletter-subscriber.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';
import { EventManagerService } from '#app/eventManager/event-manager.service';
import { UserService } from '#app/user/user.service';
import type { NewsletterSubscriber } from '#generated/prisma/client';
import type { NewsletterWithOrganization } from '#app/newsletter/newsletter.types';
import type { NewsletterConfirmation } from '@camp-registration/common/entities';

@injectable()
export class NewsletterSubscriberController extends BaseController {
  constructor(
    @inject(NewsletterSubscriberService)
    private readonly subscriberService: NewsletterSubscriberService,
    @inject(EventManagerService)
    private readonly eventManagerService: EventManagerService,
    @inject(UserService)
    private readonly userService: UserService,
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

    // The manager's language is the best guess for whom they add by hand.
    const manager = await this.userService.getUserByIdOrFail(req.authUserId());
    const subscriber = await this.subscriberService.createPendingSubscriber(
      newsletter.id,
      {
        email: body.email,
        name: body.name,
        locale: manager.locale,
        consentedAt: body.consentedAt ? new Date(body.consentedAt) : undefined,
      },
    );

    await this.sendConfirmation(newsletter, subscriber);

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

    const { created, ...result } =
      await this.subscriberService.importSubscribersFromEvent(
        newsletter.id,
        body.eventId,
        body.group,
      );

    await NewsletterConfirmationMail.enqueueBulk(
      created.map((subscriber) =>
        this.confirmationPayload(newsletter, subscriber),
      ),
    );

    res.json({ data: result });
  }

  async resendConfirmation(req: Request, res: Response) {
    const newsletter = req.modelOrFail('newsletter');
    await req.validate(validator.resendConfirmation);
    const subscriber = req.modelOrFail('newsletterSubscriber');

    if (subscriber.confirmedAt) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'This subscriber has already confirmed.',
      );
    }
    if (!this.subscriberService.canResendConfirmation(subscriber)) {
      throw new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        'A confirmation email was sent recently. Please try again later.',
      );
    }

    const renewed = await this.subscriberService.renewConfirmation(
      subscriber.id,
    );
    await this.sendConfirmation(newsletter, renewed);

    res.resource(new NewsletterSubscriberResource(renewed));
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const subscriber = req.modelOrFail('newsletterSubscriber');

    await this.subscriberService.removeSubscriber(subscriber.id);

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async showConfirmation(req: Request, res: Response) {
    const {
      params: { token },
    } = await req.validate(validator.confirmation);

    const subscriber = await this.findByConfirmationTokenOrFail(token);

    res.json({
      data: {
        newsletterName: subscriber.newsletter.name,
        organizationName: subscriber.newsletter.organization.name,
        confirmed: subscriber.confirmedAt !== null,
      } satisfies NewsletterConfirmation,
    });
  }

  async confirm(req: Request, res: Response) {
    const {
      params: { token },
    } = await req.validate(validator.confirmation);

    const subscriber = await this.findByConfirmationTokenOrFail(token);
    if (!subscriber.confirmedAt) {
      await this.subscriberService.confirm(subscriber.id);
    }

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

  private async findByConfirmationTokenOrFail(token: string) {
    const subscriber =
      await this.subscriberService.getSubscriberByConfirmationToken(token);
    if (!subscriber) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Invalid or expired confirmation link.',
      );
    }

    return subscriber;
  }

  private async sendConfirmation(
    newsletter: NewsletterWithOrganization,
    subscriber: NewsletterSubscriber,
  ) {
    await NewsletterConfirmationMail.enqueue(
      this.confirmationPayload(newsletter, subscriber),
    );
  }

  private confirmationPayload(
    newsletter: NewsletterWithOrganization,
    subscriber: NewsletterSubscriber,
  ): NewsletterConfirmationMailPayload {
    if (!subscriber.confirmationToken) {
      throw new Error('Pending subscriber without a confirmation token');
    }

    return {
      to: subscriber.email,
      name: subscriber.name,
      locale: subscriber.locale,
      newsletterName: newsletter.name,
      organizationName: newsletter.organization.name,
      replyTo: newsletter.replyTo ?? undefined,
      confirmationToken: subscriber.confirmationToken,
    };
  }
}
