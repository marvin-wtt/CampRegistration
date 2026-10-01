import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import ApiError from '#utils/ApiError';
import validator from './billing.validation.js';
import { BillingService } from './billing.service.js';
import { PriceModelService } from '#app/priceModel/price-model.service';
import {
  AdminEventBillResource,
  EventBillingResource,
  OrganizationBillingResource,
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

  async index(req: Request, res: Response) {
    const { query } = await req.validate(validator.index);

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
  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const bill = await this.billingService.createManualBill(body);

    res.status(httpStatus.CREATED).resource(new AdminEventBillResource(bill));
  }

  async update(req: Request, res: Response) {
    const { body } = await req.validate(validator.update);
    const bill = await this.billingService.updateBill(
      req.modelOrFail('eventBill'),
      body,
    );

    res.resource(new AdminEventBillResource(bill));
  }

  /** What the organization pays and what it has been billed. */
  async organization(req: Request, res: Response) {
    await req.validate(validator.organization);
    const organization = req.modelOrFail('organization');

    const [priceModel, bills] = await Promise.all([
      this.priceModelService.getPriceModelById(organization.priceModelId),
      this.billingService.getBillsForOrganization(organization.id),
    ]);
    if (!priceModel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Price model not found');
    }

    res.resource(new OrganizationBillingResource({ priceModel, bills }));
  }

  /** The model the event is priced with. */
  async event(req: Request, res: Response) {
    await req.validate(validator.event);
    const event = req.modelOrFail('event');
    const billing = await this.priceModelService.getForEvent(event.id);

    res.resource(new EventBillingResource(billing));
  }
}
