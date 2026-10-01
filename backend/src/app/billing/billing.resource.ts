import type { EventBill, PriceModel } from '#generated/prisma/client.js';
import type {
  AdminEventBill as AdminEventBillData,
  EventBill as EventBillData,
  EventBilling as EventBillingData,
  OrganizationBilling as OrganizationBillingData,
  OrganizationEventBill as OrganizationEventBillData,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { money } from '#utils/money';
import { utcCarrierToNaiveDateTime } from '@camp-registration/common/utils';
import { PriceModelResource } from '#app/priceModel/price-model.resource';
import { billedRegistrationCount } from './billing.utils.js';

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
      registrationCount: billedRegistrationCount(this.data),
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

type PriceModelSummary = Pick<PriceModel, 'id' | 'name'>;

type OrganizationBill = BillWithReplacement & {
  priceModel: PriceModelSummary | null;
  event: { priceModel: PriceModelSummary | null } | null;
};

export class OrganizationEventBillResource extends JsonResource<
  OrganizationBill & { organizationPriceModel: PriceModelSummary },
  OrganizationEventBillData
> {
  transform(): OrganizationEventBillData {
    const priceModel =
      this.data.status === 'DRAFT'
        ? (this.data.event?.priceModel ?? this.data.organizationPriceModel)
        : this.data.priceModel;

    return {
      ...new EventBillResource(this.data).transform(),
      priceModel: priceModel && { id: priceModel.id, name: priceModel.name },
    };
  }
}

export class OrganizationBillingResource extends JsonResource<
  { priceModel: PriceModel; bills: OrganizationBill[] },
  OrganizationBillingData
> {
  transform(): OrganizationBillingData {
    return {
      priceModel: new PriceModelResource(this.data.priceModel).transform(),
      bills: this.data.bills.map((bill) =>
        new OrganizationEventBillResource({
          ...bill,
          organizationPriceModel: this.data.priceModel,
        }).transform(),
      ),
    };
  }
}

export class EventBillingResource extends JsonResource<
  { priceModel: PriceModel; isOverride: boolean },
  EventBillingData
> {
  transform(): EventBillingData {
    return {
      priceModel: new PriceModelResource(this.data.priceModel).transform(),
      isOverride: this.data.isOverride,
    };
  }
}
