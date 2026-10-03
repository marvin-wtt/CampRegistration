import httpStatus from 'http-status';
import { inject, injectable } from 'inversify';
import { Prisma, type PriceModel } from '#generated/prisma/client.js';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#utils/ApiError';
import type {
  PriceModelCreateData,
  PriceModelUpdateData,
} from '@camp-registration/common/entities';
import {
  FREE_PRICE_MODEL_ID,
  FREE_PRICE_MODEL_NAME,
} from './price-model.utils.js';
import { PriceModelOfferService } from './price-model-offer.service.js';

/** Whether `data` would change what the model charges. */
function pricingChanges(
  priceModel: PriceModel,
  data: PriceModelUpdateData,
): boolean {
  const differs = (
    value: number | undefined,
    current: Prisma.Decimal,
  ): boolean => value !== undefined && !current.equals(value);

  return (
    (data.currency !== undefined && data.currency !== priceModel.currency) ||
    differs(data.pricePerRegistration, priceModel.pricePerRegistration) ||
    differs(data.baseFee, priceModel.baseFee) ||
    differs(data.taxRate, priceModel.taxRate)
  );
}

@injectable()
export class PriceModelService extends BaseService {
  constructor(
    @inject(PriceModelOfferService)
    private readonly offers: PriceModelOfferService,
  ) {
    super();
  }

  async getPriceModelById(id: string) {
    return this.prisma.priceModel.findUnique({ where: { id } });
  }

  async queryPriceModels() {
    // The name is translatable JSON, so the client sorts by the reader's
    // language; the default and live models come first.
    return this.prisma.priceModel.findMany({
      include: {
        _count: { select: { organizations: true, events: true, bills: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { archivedAt: 'asc' }, { id: 'asc' }],
    });
  }

  /**
   * The model new organizations start on.
   *
   * The migration seeds it, but a database built with `db push` or emptied by
   * a test truncate has none — rather than failing organization creation, the
   * free model is recreated as the default. The unique `isDefault` index makes
   * a concurrent recreation lose with P2002, after which the winner is read.
   */
  async getDefault(): Promise<PriceModel> {
    const existing = await this.db.priceModel.findUnique({
      where: { isDefault: true },
    });
    if (existing) {
      return existing;
    }

    try {
      return await this.db.priceModel.upsert({
        where: { id: FREE_PRICE_MODEL_ID },
        create: {
          id: FREE_PRICE_MODEL_ID,
          name: FREE_PRICE_MODEL_NAME,
          isDefault: true,
        },
        update: { isDefault: true, archivedAt: null },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return this.db.priceModel.findUniqueOrThrow({
          where: { isDefault: true },
        });
      }
      throw error;
    }
  }

  async createPriceModel(data: PriceModelCreateData) {
    return this.prisma.priceModel.create({
      data: {
        name: data.name,
        currency: data.currency,
        pricePerRegistration: data.pricePerRegistration,
        baseFee: data.baseFee,
        taxRate: data.taxRate,
      },
    });
  }

  /**
   * The name can always change and a model can be archived; its prices only
   * while nothing uses it. An organization, event or bill on a model was
   * promised those prices — a new price is a new model, assigned explicitly.
   */
  async updatePriceModel(priceModel: PriceModel, data: PriceModelUpdateData) {
    if (data.archived && priceModel.isDefault) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The default price model cannot be archived.',
      );
    }

    if (pricingChanges(priceModel, data)) {
      if (await this.isInUse(priceModel.id)) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'The prices of a price model in use cannot change. Create a new model and assign it instead.',
        );
      }
    }

    return this.prisma.priceModel.update({
      where: { id: priceModel.id },
      data: {
        name: data.name,
        currency: data.currency,
        pricePerRegistration: data.pricePerRegistration,
        baseFee: data.baseFee,
        taxRate: data.taxRate,
        archivedAt:
          data.archived === undefined
            ? undefined
            : data.archived
              ? (priceModel.archivedAt ?? new Date())
              : null,
      },
    });
  }

  /** `isDefault` is `true` or `NULL`, so clearing the old one must come first. */
  async setDefault(priceModel: PriceModel) {
    if (priceModel.archivedAt) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'An archived price model cannot be the default.',
      );
    }

    return this.transaction(async (tx) => {
      await tx.priceModel.updateMany({
        where: { isDefault: true, id: { not: priceModel.id } },
        data: { isDefault: null },
      });

      return tx.priceModel.update({
        where: { id: priceModel.id },
        data: { isDefault: true },
      });
    });
  }

  /**
   * Refused while anything points at the model: organizations and events
   * would lose their pricing, and bills their provenance. Archive it instead.
   */
  async deletePriceModel(priceModel: PriceModel) {
    if (priceModel.isDefault) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The default price model cannot be deleted.',
      );
    }

    if (await this.isInUse(priceModel.id)) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The price model is in use. Archive it instead.',
      );
    }

    await this.prisma.priceModel.delete({ where: { id: priceModel.id } });
  }

  /** Anything referring to the model makes it immutable and undeletable. */
  async countUsage(id: string) {
    const [organizations, events, bills, offers] =
      await this.prisma.$transaction([
        this.prisma.organization.count({ where: { priceModelId: id } }),
        this.prisma.event.count({ where: { priceModelId: id } }),
        this.prisma.eventBill.count({ where: { priceModelId: id } }),
        this.prisma.priceModelOffer.count({ where: { priceModelId: id } }),
      ]);

    return { organizations, events, bills, offers };
  }

  /** In use by anything, so its prices are locked. */
  private async isInUse(id: string): Promise<boolean> {
    const usage = await this.countUsage(id);

    return Object.values(usage).some((count) => count > 0);
  }

  /** The model pinned on the event, and whether its organization's differs. */
  async getForEvent(eventId: string) {
    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      select: {
        priceModel: true,
        organization: { select: { priceModelId: true } },
      },
    });

    return {
      priceModel: event.priceModel,
      isOverride: event.priceModel.id !== event.organization.priceModelId,
    };
  }

  /**
   * Moves the organization to another model directly, e.g. agreed outside
   * the app. Its events keep the model they were created with.
   */
  async assignToOrganization(organizationId: string, priceModel: PriceModel) {
    this.assertAssignable(priceModel);

    await this.transaction(async (tx) => {
      await tx.organization.update({
        where: { id: organizationId },
        data: { priceModelId: priceModel.id },
      });
      // Assigned directly, e.g. agreed outside the app: a pending offer is moot.
      await this.offers.deletePendingOffers(tx, organizationId);
    });
  }

  async assignToEvent(eventId: string, priceModel: PriceModel) {
    this.assertAssignable(priceModel);

    return this.prisma.event.update({
      where: { id: eventId },
      data: { priceModelId: priceModel.id },
      select: { id: true, priceModelId: true },
    });
  }

  private assertAssignable(priceModel: PriceModel) {
    if (priceModel.archivedAt) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'An archived price model cannot be assigned.',
      );
    }
  }
}
