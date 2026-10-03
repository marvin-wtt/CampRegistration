import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import ApiError from '#utils/ApiError';
import validator from './price-model.validation.js';
import { PriceModelService } from './price-model.service.js';
import { RealtimeService } from '#core/realtime/RealtimeService';
import {
  PriceModelResource,
  type PriceModelWithUsage,
} from './price-model.resource.js';

@injectable()
export class PriceModelController extends BaseController {
  constructor(
    @inject(PriceModelService)
    private readonly priceModelService: PriceModelService,
    @inject(RealtimeService) private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    await req.validate(validator.index);
    const priceModels: PriceModelWithUsage[] =
      await this.priceModelService.queryPriceModels();

    res.resource(PriceModelResource.collection(priceModels));
  }

  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const priceModel = await this.priceModelService.createPriceModel(body);

    res.status(httpStatus.CREATED).resource(new PriceModelResource(priceModel));
  }

  async update(req: Request, res: Response) {
    const { body } = await req.validate(validator.update);
    const priceModel = await this.priceModelService.updatePriceModel(
      req.modelOrFail('priceModel'),
      body,
    );

    res.resource(new PriceModelResource(priceModel));
  }

  async makeDefault(req: Request, res: Response) {
    await req.validate(validator.makeDefault);
    const priceModel = await this.priceModelService.setDefault(
      req.modelOrFail('priceModel'),
    );

    res.resource(new PriceModelResource(priceModel));
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    await this.priceModelService.deletePriceModel(
      req.modelOrFail('priceModel'),
    );

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async assignToOrganization(req: Request, res: Response) {
    const { body } = await req.validate(validator.assignToOrganization);
    const organization = req.modelOrFail('organization');
    const priceModel = await this.findPriceModel(body.priceModelId);

    const { updatedEvents } = await this.priceModelService.assignToOrganization(
      organization.id,
      priceModel,
      { applyToUpcomingEvents: body.applyToUpcomingEvents ?? false },
    );

    res.resource(
      new PriceModelResource(priceModel).withMeta({ updatedEvents }),
    );
  }

  async assignToEvent(req: Request, res: Response) {
    const { body } = await req.validate(validator.assignToEvent);
    const event = req.modelOrFail('event');
    const priceModel = await this.findPriceModel(body.priceModelId);

    const result = await this.priceModelService.assignToEvent(
      event.id,
      priceModel,
    );
    // An organization-wide assignment isn't announced: it would take one
    // event per affected event, for something that rarely changes.
    void this.realtimeService.emitInvalidation(event.id, 'billing');

    res.json({ data: result });
  }

  private async findPriceModel(id: string) {
    const priceModel = await this.priceModelService.getPriceModelById(id);
    if (!priceModel) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unknown price model');
    }

    return priceModel;
  }
}
