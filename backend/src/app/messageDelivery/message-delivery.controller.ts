import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject } from 'inversify';
import { MessageDeliveryService } from '#app/messageDelivery/message-delivery.service';
import { MessageDeliveryResource } from '#app/messageDelivery/message-delivery.resource';

export class MessageDeliveryController extends BaseController {
  constructor(
    @inject(MessageDeliveryService)
    private readonly deliveryService: MessageDeliveryService,
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
}
