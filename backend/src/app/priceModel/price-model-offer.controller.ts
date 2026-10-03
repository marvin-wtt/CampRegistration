import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import type { Organization, PriceModel } from '#generated/prisma/client.js';
import type {
  PendingPriceModelOffer,
  PriceModelChangeResult,
} from '@camp-registration/common/entities';
import { BaseController } from '#core/base/BaseController';
import ApiError from '#utils/ApiError';
import { OrganizationMemberService } from '#app/organizationMember/organization-member.service';
import validator from './price-model.validation.js';
import { PriceModelService } from './price-model.service.js';
import {
  PriceModelOfferService,
  type OfferWithModel,
} from './price-model-offer.service.js';
import { PriceModelOfferResource } from './price-model.resource.js';
import {
  PriceModelLoweredMessage,
  PriceModelOfferedMessage,
} from './price-model.messages.js';

/** A model as the emails quote it. */
function quoted(priceModel: PriceModel) {
  return {
    name: priceModel.name,
    currency: priceModel.currency,
    pricePerRegistration: priceModel.pricePerRegistration.toFixed(2),
    baseFee: priceModel.baseFee.toFixed(2),
    taxRate: priceModel.taxRate.toFixed(2),
  };
}

@injectable()
export class PriceModelOfferController extends BaseController {
  constructor(
    @inject(PriceModelService)
    private readonly priceModelService: PriceModelService,
    @inject(PriceModelOfferService)
    private readonly offerService: PriceModelOfferService,
    @inject(OrganizationMemberService)
    private readonly organizationMemberService: OrganizationMemberService,
  ) {
    super();
  }

  /**
   * Changes the organization's model: at once if nothing gets more
   * expensive, else as an offer it has to accept. Either way its
   * administrators are told by email — the durable notice a change of terms
   * needs.
   */
  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.storeOffer);
    const organization = req.modelOrFail('organization');
    const [current, next] = await Promise.all([
      this.priceModelService.getPriceModelById(organization.priceModelId),
      this.priceModelService.getPriceModelById(body.priceModelId),
    ]);
    if (!current || !next) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unknown price model');
    }

    const { outcome, offer } = await this.offerService.changeOrganizationModel(
      { ...organization, priceModel: current },
      next,
      body.effectiveOn,
      req.authUserId(),
    );

    await this.notifyOrganization(organization, next, offer);

    const result: PriceModelChangeResult = {
      outcome,
      offer: offer ? new PriceModelOfferResource(offer).transform() : null,
    };
    res.status(httpStatus.CREATED).json({ data: result });
  }

  /**
   * When the organization's pending price change takes effect, so whoever
   * creates its events can be warned ahead. The prices stay on the billing
   * page, which not every event creator may see.
   */
  async showPending(req: Request, res: Response) {
    await req.validate(validator.showPendingOffer);
    const offer = await this.offerService.getPendingOffer(
      req.modelOrFail('organization').id,
    );
    const pending: PendingPriceModelOffer | null = offer
      ? { effectiveAt: offer.effectiveAt.toISOString() }
      : null;

    res.json({ data: pending });
  }

  async withdraw(req: Request, res: Response) {
    await req.validate(validator.withdrawOffer);
    await this.offerService.withdraw(this.offerOf(req));

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async accept(req: Request, res: Response) {
    await req.validate(validator.acceptOffer);
    const offer = await this.offerService.accept(
      this.offerOf(req),
      req.authUserId(),
    );

    res.resource(new PriceModelOfferResource(offer));
  }

  /** The bound offer, if it belongs to the organization in the route. */
  private offerOf(req: Request) {
    const offer = req.modelOrFail('priceModelOffer');
    if (offer.organizationId !== req.modelOrFail('organization').id) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Offer not found');
    }

    return offer;
  }

  private async notifyOrganization(
    organization: Organization,
    priceModel: PriceModel,
    offer: OfferWithModel | null,
  ) {
    const recipients =
      await this.organizationMemberService.getAdministratorRecipients(
        organization.id,
      );
    const base = {
      organization: { id: organization.id, name: organization.name },
      priceModel: quoted(priceModel),
    };

    if (offer) {
      await PriceModelOfferedMessage.enqueueBulk(
        recipients.map((recipient) => ({
          ...base,
          effectiveAt: offer.effectiveAt.toISOString(),
          recipient,
        })),
      );
      return;
    }

    await PriceModelLoweredMessage.enqueueBulk(
      recipients.map((recipient) => ({ ...base, recipient })),
    );
  }
}
