import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { PayoutService } from '#app/payout/payout.service';
import { PayoutResource } from '#app/payout/payout.resource';
import validator from '#app/payout/payout.validation';

@injectable()
export class PayoutController extends BaseController {
  constructor(
    @inject(PayoutService) private readonly payoutService: PayoutService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const { query } = await req.validate(validator.index);
    const event = req.modelOrFail('event');

    const payouts = await this.payoutService.queryPayouts(
      event.id,
      query.view === 'own' ? req.authUserId() : undefined,
    );

    res.resource(PayoutResource.collection(payouts));
  }

  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const event = req.modelOrFail('event');

    const payout = await this.payoutService.createPayout(
      event.id,
      body,
      req.authUserId(),
    );

    void this.realtimeService.emit(event.id, 'payout', payout.id, 'created');

    res.status(httpStatus.CREATED).resource(new PayoutResource(payout));
  }

  async update(req: Request, res: Response) {
    const { body } = await req.validate(validator.update);
    const payout = req.modelOrFail('payout');

    const updated = await this.payoutService.updatePayout(payout, body);

    void this.realtimeService.emit(
      updated.eventId,
      'payout',
      updated.id,
      'updated',
    );

    res.resource(new PayoutResource(updated));
  }

  async sign(req: Request, res: Response) {
    const { body } = await req.validate(validator.sign);
    const payout = req.modelOrFail('payout');

    const signed = await this.payoutService.signPayout(payout, body.signature);

    void this.realtimeService.emit(
      signed.eventId,
      'payout',
      signed.id,
      'updated',
    );

    res.resource(new PayoutResource(signed));
  }

  async unsign(req: Request, res: Response) {
    await req.validate(validator.unsign);
    const payout = req.modelOrFail('payout');

    const unsigned = await this.payoutService.unsignPayout(payout);

    void this.realtimeService.emit(
      unsigned.eventId,
      'payout',
      unsigned.id,
      'updated',
    );

    res.resource(new PayoutResource(unsigned));
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const payout = req.modelOrFail('payout');

    await this.payoutService.deletePayout(payout);

    void this.realtimeService.emit(
      payout.eventId,
      'payout',
      payout.id,
      'deleted',
    );

    res.status(httpStatus.NO_CONTENT).send();
  }
}
