import httpStatus from 'http-status';
import { injectable } from 'inversify';
import type {
  Organization,
  PriceModel,
  PriceModelOffer,
  Prisma,
} from '#generated/prisma/client.js';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#utils/ApiError';
import { dayOf } from '#utils/date';
import { BILLING_TIME_ZONE } from '#app/billing/billing.utils';
import { zonedInstant } from '@camp-registration/common/utils';
import { PRICE_MODEL_OFFER_MIN_NOTICE_DAYS } from '@camp-registration/common/entities';
import { costsNoMore } from './price-model.utils.js';

const offerInclude = { priceModel: true } as const;

export type OfferWithModel = PriceModelOffer & { priceModel: PriceModel };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Price changes are contract changes. One that makes nothing more expensive
 * applies at once; anything else becomes an offer the organization must
 * accept, announced ahead of its effective date. From then on it can't create
 * events until it accepts, while its existing events keep their model.
 *
 * An offer is pending until accepted (`acceptedAt`). Withdrawing or replacing
 * it deletes it; accepted offers stay as the record of what was agreed.
 */
@injectable()
export class PriceModelOfferService extends BaseService {
  async getOfferById(id: string) {
    return this.prisma.priceModelOffer.findUnique({
      where: { id },
      include: offerInclude,
    });
  }

  /** The offer awaiting the organization's acceptance, if any. */
  async getPendingOffer(organizationId: string) {
    return this.prisma.priceModelOffer.findFirst({
      where: { organizationId, acceptedAt: null },
      include: offerInclude,
    });
  }

  /**
   * Moves the organization to `next`: at once when nothing gets more
   * expensive, else as an offer taking effect on `effectiveOn` (`YYYY-MM-DD`
   * in the billing time zone). Either way, it replaces a pending offer.
   */
  async changeOrganizationModel(
    organization: Organization & { priceModel: PriceModel },
    next: PriceModel,
    effectiveOn: string,
    createdByUserId: string,
    now = new Date(),
  ): Promise<{ outcome: 'applied' | 'offered'; offer: OfferWithModel | null }> {
    if (next.archivedAt) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'An archived price model cannot be offered.',
      );
    }
    if (next.id === organization.priceModelId) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The organization is already on this price model.',
      );
    }

    if (costsNoMore(organization.priceModel, next)) {
      await this.transaction(async (tx) => {
        await this.deletePendingOffers(tx, organization.id);
        await tx.organization.update({
          where: { id: organization.id },
          data: { priceModelId: next.id },
        });
      });

      return { outcome: 'applied', offer: null };
    }

    const earliest = earliestEffectiveDay(now);
    if (effectiveOn < earliest) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `A price increase needs at least ${PRICE_MODEL_OFFER_MIN_NOTICE_DAYS.toString()} days' notice; the earliest effective date is ${earliest}.`,
      );
    }

    const offer = await this.transaction(async (tx) => {
      await this.deletePendingOffers(tx, organization.id);

      return tx.priceModelOffer.create({
        data: {
          organizationId: organization.id,
          priceModelId: next.id,
          effectiveAt: zonedInstant(
            `${effectiveOn}T00:00:00`,
            BILLING_TIME_ZONE,
          ),
          createdByUserId,
        },
        include: offerInclude,
      });
    });

    return { outcome: 'offered', offer };
  }

  async withdraw(offer: PriceModelOffer) {
    this.assertPending(offer);

    await this.prisma.priceModelOffer.delete({ where: { id: offer.id } });
  }

  /** Moves the organization to the offered model and records who agreed. */
  async accept(offer: PriceModelOffer, userId: string) {
    this.assertPending(offer);
    const { organizationId } = offer;
    if (!organizationId) {
      throw new ApiError(httpStatus.CONFLICT, 'The offer is no longer open.');
    }

    return this.transaction(async (tx) => {
      // Conditional, so a concurrent acceptance or replacement can't race it.
      const { count } = await tx.priceModelOffer.updateMany({
        where: { id: offer.id, acceptedAt: null },
        data: { acceptedByUserId: userId, acceptedAt: new Date() },
      });
      if (count === 0) {
        throw new ApiError(httpStatus.CONFLICT, 'The offer is no longer open.');
      }
      await tx.organization.update({
        where: { id: organizationId },
        data: { priceModelId: offer.priceModelId },
      });

      return tx.priceModelOffer.findUniqueOrThrow({
        where: { id: offer.id },
        include: offerInclude,
      });
    });
  }

  /**
   * Refuses new events once a pending offer is due: the old terms end for
   * new events until the organization accepts, or an administrator withdraws
   * the offer or assigns a model.
   */
  async assertMayCreateEvents(organizationId: string, now = new Date()) {
    const due = await this.prisma.priceModelOffer.count({
      where: { organizationId, acceptedAt: null, effectiveAt: { lte: now } },
    });
    if (due > 0) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The organization has to accept its new price model before it can create events.',
        { code: 'PRICE_MODEL_NOT_ACCEPTED' },
      );
    }
  }

  /** Replaced, e.g. by an administrator assigning a model directly. */
  async deletePendingOffers(
    tx: Prisma.TransactionClient,
    organizationId: string,
  ) {
    await tx.priceModelOffer.deleteMany({
      where: { organizationId, acceptedAt: null },
    });
  }

  private assertPending(offer: PriceModelOffer) {
    if (offer.acceptedAt) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The offer was already accepted.',
      );
    }
  }
}

/** The first day an increase may take effect, in the billing time zone. */
export function earliestEffectiveDay(now: Date): string {
  return dayOf(
    new Date(now.getTime() + PRICE_MODEL_OFFER_MIN_NOTICE_DAYS * DAY_MS),
    BILLING_TIME_ZONE,
  );
}
