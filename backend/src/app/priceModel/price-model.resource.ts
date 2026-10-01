import type { PriceModel } from '#generated/prisma/client.js';
import type {
  PriceModelCurrency,
  PriceModel as PriceModelData,
  PriceModelSummary,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { money } from '#utils/money';

export const priceModelSummarySelect = {
  id: true,
  name: true,
  isDefault: true,
} as const;

/** `isDefault` is `true` or `NULL` in the database. */
export function priceModelSummary(
  priceModel: Pick<PriceModel, 'id' | 'name' | 'isDefault'>,
): PriceModelSummary {
  return {
    id: priceModel.id,
    name: priceModel.name,
    isDefault: priceModel.isDefault === true,
  };
}

export type PriceModelWithUsage = PriceModel & {
  _count?: { organizations: number; events: number } | undefined;
};

export class PriceModelResource extends JsonResource<
  PriceModelWithUsage,
  PriceModelData
> {
  transform(): PriceModelData {
    return {
      ...(this.data._count ? { usage: this.data._count } : {}),
      id: this.data.id,
      name: this.data.name,
      // Validated against `PRICE_MODEL_CURRENCIES` on every write.
      currency: this.data.currency as PriceModelCurrency,
      pricePerRegistration: money(this.data.pricePerRegistration),
      baseFee: money(this.data.baseFee),
      taxRate: money(this.data.taxRate),
      isDefault: this.data.isDefault === true,
      archivedAt: this.data.archivedAt?.toISOString() ?? null,
      createdAt: this.data.createdAt.toISOString(),
      updatedAt: this.data.updatedAt?.toISOString() ?? null,
    };
  }
}
