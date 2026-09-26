import { type Request, type Response } from 'express';
import httpStatus from 'http-status';
import { BaseController } from '#core/base/BaseController';
import { inject } from 'inversify';
import { MessageDeliveryService } from '#app/messageDelivery/message-delivery.service';
import { MessageDeliveryResource } from '#app/messageDelivery/message-delivery.resource';
import validator from '#app/messageDelivery/message-delivery.validation';
import { MessageService } from '#app/message/message.service';
import { MessageTemplateService } from '#app/messageTemplate/message-template.service';
import {
  messageToRenderable,
  type RenderableMessage,
  templateToRenderable,
} from '#app/registration/messages/renderable-message';
import { RegistrationTemplateMessage } from '#app/registration/messages/template.mail';
import ApiError from '#utils/ApiError';

export class MessageDeliveryController extends BaseController {
  constructor(
    @inject(MessageDeliveryService)
    private readonly deliveryService: MessageDeliveryService,
    @inject(MessageService)
    private readonly messageService: MessageService,
    @inject(MessageTemplateService)
    private readonly messageTemplateService: MessageTemplateService,
  ) {
    super();
  }

  async indexForRegistration(req: Request, res: Response) {
    const registration = req.modelOrFail('registration');

    const deliveries = await this.deliveryService.getDeliveriesForRegistration(
      registration.id,
    );

    res.resource(MessageDeliveryResource.collection(deliveries));
  }

  /**
   * Renders the delivery's source again — the manual message or the automated
   * template — and sends it to the registration's *current* addresses, so a
   * corrected address after a bounce receives it. The stored copy can't be
   * replayed instead: its changed values are redacted.
   */
  async resend(req: Request, res: Response) {
    const {
      params: { deliveryId },
    } = await req.validate(validator.resend);
    const event = req.modelOrFail('event');
    const registration = req.modelOrFail('registration');

    const delivery = await this.deliveryService.getDeliveryForRegistration(
      registration.id,
      deliveryId,
    );
    if (!delivery) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
    }

    const renderable = await this.loadSource(
      event.id,
      delivery.messageId,
      delivery.templateId,
    );
    if (!renderable) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The message or template this email was sent from no longer exists',
      );
    }

    if (!registration.emails?.length) {
      throw new ApiError(
        httpStatus.UNPROCESSABLE_ENTITY,
        'Registration has no email address',
      );
    }

    await RegistrationTemplateMessage.enqueueForAll(
      event,
      [registration],
      renderable,
    );

    // Deliveries are recorded once the queued mail is built.
    res.sendStatus(httpStatus.ACCEPTED);
  }

  private async loadSource(
    eventId: string,
    messageId: string | null,
    templateId: string | null,
  ): Promise<RenderableMessage | null> {
    if (messageId) {
      const message = await this.messageService.getMessageById(
        eventId,
        messageId,
      );
      return message ? messageToRenderable(message) : null;
    }

    if (templateId) {
      const template = await this.messageTemplateService.getMessageTemplateById(
        eventId,
        templateId,
      );
      return template ? templateToRenderable(template) : null;
    }

    return null;
  }
}
