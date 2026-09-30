import type {
  EventBill,
  PriceModel,
  Prisma,
} from '#generated/prisma/client.js';
import type {
  PriceModelCurrency,
  AdminEventBill as AdminEventBillData,
  EventBill as EventBillData,
  OrganizationBilling as OrganizationBillingData,
  PriceModel as PriceModelData,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { utcCarrierToNaiveDateTime } from '@camp-registration/common/utils';

/** Money leaves as a fixed two-decimal string, never as a float. */
function money(value: Prisma.Decimal): string;
function money(value: Prisma.Decimal | null): string | null;
function money(value: Prisma.Decimal | null): string | null {
  return value?.toFixed(2) ?? null;
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

/** A bill as the billing service loads it: with its replacement, if any. */
type BillWithReplacement = EventBill & { replacedBy: { id: string } | null };

export class EventBillResource extends JsonResource<
  BillWithReplacement,
  EventBillData
> {
  transform(): EventBillData {
    return {
      id: this.data.id,
      eventId: this.data.eventId,
      organizationId: this.data.organizationId,
      priceModelId: this.data.priceModelId,
      status: this.data.status,
      startRegistrationCount: this.data.startRegistrationCount,
      endRegistrationCount: this.data.endRegistrationCount,
      adjustedRegistrationCount: this.data.adjustedRegistrationCount,
      registrationCount: this.data.registrationCount,
      replacesBillId: this.data.replacesBillId,
      replacedByBillId: this.data.replacedBy?.id ?? null,
      eventName: this.data.eventName,
      eventStartAt: utcCarrierToNaiveDateTime(this.data.eventStartAt),
      eventEndAt: utcCarrierToNaiveDateTime(this.data.eventEndAt),
      eventTimezone: this.data.eventTimezone,
      currency: this.data.currency,
      pricePerRegistration: money(this.data.pricePerRegistration),
      baseFee: money(this.data.baseFee),
      taxRate: money(this.data.taxRate),
      netAmount: money(this.data.netAmount),
      taxAmount: money(this.data.taxAmount),
      grossAmount: money(this.data.grossAmount),
      finalizedAt: this.data.finalizedAt?.toISOString() ?? null,
      paidAt: this.data.paidAt?.toISOString() ?? null,
      voidedAt: this.data.voidedAt?.toISOString() ?? null,
      note: this.data.note,
      createdAt: this.data.createdAt.toISOString(),
    };
  }
}

export class AdminEventBillResource extends JsonResource<
  BillWithReplacement & { organization: { id: string; name: string } },
  AdminEventBillData
> {
  transform(): AdminEventBillData {
    return {
      ...new EventBillResource(this.data).transform(),
      organization: {
        id: this.data.organization.id,
        name: this.data.organization.name,
      },
    };
  }
}

export class OrganizationBillingResource extends JsonResource<
  {
    priceModel: PriceModel;
    bills: BillWithReplacement[];
    eventOverrides: {
      id: string;
      name: EventBill['eventName'];
      startAt: Date;
      endAt: Date;
      priceModel: PriceModel | null;
    }[];
  },
  OrganizationBillingData
> {
  transform(): OrganizationBillingData {
    return {
      priceModel: new PriceModelResource(this.data.priceModel).transform(),
      bills: this.data.bills.map((bill) =>
        new EventBillResource(bill).transform(),
      ),
      eventOverrides: this.data.eventOverrides.flatMap((event) =>
        event.priceModel
          ? [
              {
                eventId: event.id,
                eventName: event.name,
                eventStartAt: utcCarrierToNaiveDateTime(event.startAt),
                eventEndAt: utcCarrierToNaiveDateTime(event.endAt),
                priceModel: new PriceModelResource(
                  event.priceModel,
                ).transform(),
              },
            ]
          : [],
      ),
    };
  }
}
