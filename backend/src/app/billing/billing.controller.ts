import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import ApiError from '#utils/ApiError';
import validator from './billing.validation.js';
import { BillingService } from './billing.service.js';
import { PriceModelService } from './price-model.service.js';
import {
  AdminEventBillResource,
  OrganizationBillingResource,
  PriceModelResource,
  type PriceModelWithUsage,
} from './billing.resource.js';

@injectable()
export class BillingController extends BaseController {
  constructor(
    @inject(BillingService) private readonly billingService: BillingService,
    @inject(PriceModelService)
    private readonly priceModelService: PriceModelService,
  ) {
    super();
  }

  async priceModelIndex(req: Request, res: Response) {
    await req.validate(validator.priceModelIndex);
    const priceModels: PriceModelWithUsage[] =
      await this.priceModelService.queryPriceModels();

    res.resource(PriceModelResource.collection(priceModels));
  }

  async priceModelStore(req: Request, res: Response) {
    const { body } = await req.validate(validator.priceModelStore);
    const priceModel = await this.priceModelService.createPriceModel(body);

    res.status(httpStatus.CREATED).resource(new PriceModelResource(priceModel));
  }

  async priceModelUpdate(req: Request, res: Response) {
    const { body } = await req.validate(validator.priceModelUpdate);
    const priceModel = await this.priceModelService.updatePriceModel(
      req.modelOrFail('priceModel'),
      body,
    );

    res.resource(new PriceModelResource(priceModel));
  }

  async priceModelDefault(req: Request, res: Response) {
    await req.validate(validator.priceModelDefault);
    const priceModel = await this.priceModelService.setDefault(
      req.modelOrFail('priceModel'),
    );

    res.resource(new PriceModelResource(priceModel));
  }

  async priceModelDestroy(req: Request, res: Response) {
    await req.validate(validator.priceModelDestroy);
    await this.priceModelService.deletePriceModel(
      req.modelOrFail('priceModel'),
    );

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async organizationPriceModel(req: Request, res: Response) {
    const { body } = await req.validate(validator.organizationPriceModel);
    const organization = req.modelOrFail('organization');
    const priceModel = await this.findPriceModel(body.priceModelId);

    await this.priceModelService.assignToOrganization(
      organization.id,
      priceModel,
    );

    res.resource(new PriceModelResource(priceModel));
  }

  async eventPriceModel(req: Request, res: Response) {
    const { body } = await req.validate(validator.eventPriceModel);
    const event = req.modelOrFail('event');
    const priceModel = body.priceModelId
      ? await this.findPriceModel(body.priceModelId)
      : null;

    const result = await this.priceModelService.assignToEvent(
      event.id,
      priceModel,
    );

    res.json({ data: result });
  }

  async billIndex(req: Request, res: Response) {
    const { query } = await req.validate(validator.billIndex);

    const { bills, nextCursor, limit, total } =
      await this.billingService.queryBills(
        {
          status: query?.status,
          organizationId: query?.organizationId,
          search: query?.search,
        },
        { cursor: query?.cursor, limit: query?.limit },
      );

    res.resource(
      AdminEventBillResource.collection(bills).withCursor(
        nextCursor,
        limit,
        total,
      ),
    );
  }

  /** Bills an ended event by hand, or again after its bill was voided. */
  async billStore(req: Request, res: Response) {
    const { body } = await req.validate(validator.billStore);
    const bill = await this.billingService.createManualBill(body);

    res.status(httpStatus.CREATED).resource(new AdminEventBillResource(bill));
  }

  async billUpdate(req: Request, res: Response) {
    const { body } = await req.validate(validator.billUpdate);
    const bill = await this.billingService.updateBill(
      req.modelOrFail('eventBill'),
      body,
    );

    res.resource(new AdminEventBillResource(bill));
  }

  /** What the organization pays and what it has been billed. */
  async organizationBilling(req: Request, res: Response) {
    await req.validate(validator.organizationBilling);
    const organization = req.modelOrFail('organization');

    const [priceModel, bills, eventOverrides] = await Promise.all([
      this.priceModelService.getPriceModelById(organization.priceModelId),
      this.billingService.getBillsForOrganization(organization.id),
      this.priceModelService.getEventOverrides(organization.id),
    ]);
    if (!priceModel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Price model not found');
    }

    res.resource(
      new OrganizationBillingResource({ priceModel, bills, eventOverrides }),
    );
  }

  private async findPriceModel(id: string) {
    const priceModel = await this.priceModelService.getPriceModelById(id);
    if (!priceModel) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unknown price model');
    }

    return priceModel;
  }
}
