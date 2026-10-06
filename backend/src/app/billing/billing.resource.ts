import type {
  EventBill,
  File,
  Invoice,
  PriceModel,
  PriceModelOffer,
} from '#generated/prisma/client.js';
import type {
  AdminEventBill as AdminEventBillData,
  EventBill as EventBillData,
  EventBillCustomer,
  EventBilling as EventBillingData,
  Invoice as InvoiceData,
  OrganizationBilling as OrganizationBillingData,
  OrganizationEventBill as OrganizationEventBillData,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';
import { money } from '#utils/money';
import { utcCarrierToNaiveDateTime } from '@camp-registration/common/utils';
import {
  PriceModelOfferResource,
  PriceModelResource,
} from '#app/priceModel/price-model.resource';
import {
  billedRegistrationCount,
  calculateBillAmounts,
} from './billing.utils.js';

type InvoiceWithFiles = Invoice & { files: File[] };

/** A bill as the billing service loads it: with its replacement and invoices. */
type BillWithReplacement = EventBill & {
  replacedBy: { id: string } | null;
  invoices: InvoiceWithFiles[];
};

export class InvoiceResource extends JsonResource<
  InvoiceWithFiles,
  InvoiceData
> {
  transform(): InvoiceData {
    const file = this.data.files.at(0);

    return {
      id: this.data.id,
      eventBillId: this.data.eventBillId,
      source: this.data.source,
      type: this.data.type,
      number: this.data.number,
      cancelsInvoiceId: this.data.cancelsInvoiceId,
      issuedAt: this.data.issuedAt.toISOString(),
      file: file
        ? {
            name: file.originalName,
            size: file.size,
            ready: file.uploadStatus === 'READY',
          }
        : null,
      createdAt: this.data.createdAt.toISOString(),
    };
  }
}

export class EventBillResource extends JsonResource<
  BillWithReplacement,
  EventBillData
> {
  transform(): EventBillData {
    return {
      id: this.data.id,
      eventId: this.data.eventId,
      organizationId: this.data.organizationId,
      customer: this.customer(),
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
      invoices: this.data.invoices.map((invoice) =>
        new InvoiceResource(invoice).transform(),
      ),
      createdAt: this.data.createdAt.toISOString(),
    };
  }

  private customer(): EventBillCustomer | null {
    const bill = this.data;
    if (
      bill.customerName === null ||
      bill.customerAddressStreet === null ||
      bill.customerAddressZipCode === null ||
      bill.customerAddressCity === null ||
      bill.customerCountry === null
    ) {
      return null;
    }

    return {
      name: bill.customerName,
      addressStreet: bill.customerAddressStreet,
      addressZipCode: bill.customerAddressZipCode,
      addressCity: bill.customerAddressCity,
      country: bill.customerCountry,
      vatNumber: bill.customerVatNumber,
    };
  }
}

export class AdminEventBillResource extends JsonResource<
  BillWithReplacement & { organization: { id: string; name: string } | null },
  AdminEventBillData
> {
  transform(): AdminEventBillData {
    const { organization } = this.data;

    return {
      ...new EventBillResource(this.data).transform(),
      organization: organization
        ? { id: organization.id, name: organization.name }
        : null,
      note: this.data.note,
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
        ? (this.data.event?.priceModel ??
          this.data.priceModel ??
          this.data.organizationPriceModel)
        : this.data.priceModel;

    return {
      ...new EventBillResource(this.data).transform(),
      priceModel: priceModel && { id: priceModel.id, name: priceModel.name },
    };
  }
}

export class OrganizationBillingResource extends JsonResource<
  {
    priceModel: PriceModel;
    offer: (PriceModelOffer & { priceModel: PriceModel }) | null;
    bills: OrganizationBill[];
  },
  OrganizationBillingData
> {
  transform(): OrganizationBillingData {
    const { offer } = this.data;

    return {
      priceModel: new PriceModelResource(this.data.priceModel).transform(),
      offer: offer ? new PriceModelOfferResource(offer).transform() : null,
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
  {
    priceModel: PriceModel;
    isOverride: boolean;
    bill: BillWithReplacement | null;
    acceptedRegistrationCount: number;
  },
  EventBillingData
> {
  transform(): EventBillingData {
    const { priceModel, bill, acceptedRegistrationCount } = this.data;
    // Counted now as the end count, beside a running bill's start count.
    const registrationCount = billedRegistrationCount({
      startRegistrationCount: bill?.startRegistrationCount ?? 0,
      endRegistrationCount: acceptedRegistrationCount,
      adjustedRegistrationCount: null,
    });

    return {
      priceModel: new PriceModelResource(priceModel).transform(),
      isOverride: this.data.isOverride,
      bill: bill && new EventBillResource(bill).transform(),
      estimate: {
        registrationCount,
        grossAmount: money(
          calculateBillAmounts(priceModel, registrationCount).grossAmount,
        ),
      },
    };
  }
}
