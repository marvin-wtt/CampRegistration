import type { Identifiable } from './Identifiable.js';
import type { Translatable } from './Translatable.js';

/**
 * The currencies a price model can bill in — those of the countries the
 * platform serves. Money is never converted, so this is a closed list.
 */
export const PRICE_MODEL_CURRENCIES = [
  'EUR',
  'CZK',
  'PLN',
  'GBP',
  'CHF',
  'USD',
] as const;

export type PriceModelCurrency = (typeof PRICE_MODEL_CURRENCIES)[number];

/**
 * What an organization is charged for an event. Money travels as decimal
 * strings ("12.50") so no amount ever passes through a float.
 */
export interface PriceModel extends Identifiable {
  name: Translatable;
  currency: PriceModelCurrency;
  pricePerRegistration: string;
  baseFee: string;
  /** Percent, e.g. "19.00". */
  taxRate: string;
  isDefault: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  /** How many organizations and event overrides use it; admin listing only. */
  usage?: { organizations: number; events: number; bills: number };
}

/** What a listing needs to show which model applies. */
export type PriceModelSummary = Pick<PriceModel, 'id' | 'name' | 'isDefault'>;

export interface PriceModelCreateData {
  name: Translatable;
  currency?: PriceModelCurrency;
  pricePerRegistration: number;
  baseFee?: number;
  taxRate?: number;
}

export type PriceModelUpdateData = Partial<PriceModelCreateData> & {
  archived?: boolean;
};

export interface PriceModelAssignmentData {
  priceModelId: string;
}

export interface OrganizationPriceModelAssignmentData extends PriceModelAssignmentData {
  /**
   * Also move the organization's events that have not started and are still
   * on its previous model. Events with a model of their own keep it.
   */
  applyToUpcomingEvents?: boolean;
}

/**
 * - `DRAFT`: the event is running; only the start count is known.
 * - `OPEN`: finalized after the event ended and awaiting payment.
 * - `PAID` / `VOID`: settled by an administrator (a zero total is `PAID` at once).
 */
export type EventBillStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'VOID';

/**
 * - `UPLOADED`: a PDF an administrator attached.
 * - `GENERATED`: issued by the platform itself, numbered.
 */
export type InvoiceSource = 'UPLOADED' | 'GENERATED';

export type InvoiceType = 'INVOICE' | 'CANCELLATION';

export interface Invoice extends Identifiable {
  eventBillId: string;
  source: InvoiceSource;
  type: InvoiceType;
  /** The sequential invoice number; only `GENERATED` invoices have one. */
  number: string | null;
  /** On a `CANCELLATION`: the invoice it cancels. */
  cancelsInvoiceId: string | null;
  issuedAt: string;
  /** The PDF; `ready` is false while it is still being stored. */
  file: { name: string; size: number; ready: boolean } | null;
  createdAt: string;
}

/** Attaches a PDF uploaded as a temporary file by the same session. */
export interface InvoiceCreateData {
  fileId: string;
}

/** The organization as billed, frozen when the bill is finalized. */
export interface EventBillCustomer {
  name: string;
  addressStreet: string;
  addressZipCode: string;
  addressCity: string;
  country: string;
  vatNumber: string | null;
}

export interface EventBill extends Identifiable {
  eventId: string | null;
  /** `null` once the organization is deleted; `customer` keeps who was billed. */
  organizationId: string | null;
  /** `null` while the bill is running. */
  customer: EventBillCustomer | null;
  priceModelId: string | null;
  status: EventBillStatus;
  /** Accepted registrations when the event started. */
  startRegistrationCount: number;
  /** Accepted registrations when the event ended; `null` while running. */
  endRegistrationCount: number | null;
  /** An administrator's correction, overriding the measured counts. */
  adjustedRegistrationCount: number | null;
  /** What is billed: the adjustment if any, else the higher measured count. Derived, not stored. */
  registrationCount: number;
  /** The voided bill this one replaces. */
  replacesBillId: string | null;
  /** The bill issued to replace this voided one. */
  replacedByBillId: string | null;

  eventName: Translatable;
  /** Naive local datetimes in `eventTimezone`, like the event's own. */
  eventStartAt: string;
  eventEndAt: string;
  eventTimezone: string;

  currency: string | null;
  pricePerRegistration: string | null;
  baseFee: string | null;
  taxRate: string | null;
  netAmount: string | null;
  taxAmount: string | null;
  grossAmount: string | null;

  finalizedAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  note: string | null;
  invoices: Invoice[];
  createdAt: string;
}

export interface AdminEventBill extends EventBill {
  /** `null` once the organization is deleted. */
  organization: { id: string; name: string } | null;
}

export interface EventBillUpdateData {
  status?: Extract<EventBillStatus, 'PAID' | 'VOID'>;
  note?: string | null;
  /** Corrects the billed count of an OPEN bill; `null` removes a correction. */
  adjustedRegistrationCount?: number | null;
}

/**
 * Bills an event by hand: either an ended event without a live bill
 * (`eventId`), or again after its bill was voided (`replacesBillId`).
 */
export type EventBillCreateData = (
  | { eventId: string; replacesBillId?: never }
  | { replacesBillId: string; eventId?: never }
) & {
  /** Defaults to the event's model, else the organization's. */
  priceModelId?: string;
  /** Overrides the counted registrations. */
  adjustedRegistrationCount?: number;
  note?: string | null;
};

export interface EventBillQuery {
  cursor?: string;
  limit?: number;
  status?: EventBillStatus;
  organizationId?: string;
  /** Matches the organization name. */
  search?: string;
  /** `YYYY-MM`: bills finalized in that month. */
  month?: string;
}

/**
 * One month of billing in one currency. Months are calendar months in the
 * platform's billing time zone; voided bills are left out.
 */
export interface BillingMonth {
  /** `YYYY-MM` */
  month: string;
  currency: string;
  /** Bills finalized in the month. */
  bills: number;
  netAmount: string;
  taxAmount: string;
  grossAmount: string;
  /** Paid in the month, whenever the bill was finalized. */
  receivedAmount: string;
  /** Of the month's bills, what is still unpaid. */
  openAmount: string;
}

/** A year's totals in one currency: its months added up. */
export type BillingTotal = Omit<BillingMonth, 'month'>;

/** One calendar year of billing, for the platform's bookkeeping. */
export interface BillingSummary {
  year: number;
  /** Every year since billing started, newest first, for choosing another. */
  years: number[];
  /**
   * Newest first: up to the current month in the current year, and from the
   * first month anything was billed in the first year.
   */
  months: BillingMonth[];
  totals: BillingTotal[];
}

export interface BillingSummaryQuery {
  /** Defaults to the current year. */
  year?: number;
}

export interface EventBillExportQuery {
  /** `YYYY-MM`, inclusive. */
  from: string;
  /** `YYYY-MM`, inclusive. */
  to: string;
}

/** A bill as its organization sees it. */
export interface OrganizationEventBill extends EventBill {
  /**
   * The model the bill was priced with — for a DRAFT, the one it will be
   * priced with. `null` when that model no longer exists.
   */
  priceModel: Pick<PriceModel, 'id' | 'name'> | null;
}

export interface OrganizationBilling {
  priceModel: PriceModel;
  bills: OrganizationEventBill[];
}

/** The model an event is priced with, as its managers see it. */
export interface EventBilling {
  priceModel: PriceModel;
  /** The event's model differs from the one its organization is on now. */
  isOverride: boolean;
  /** The event's live bill — the end of its replacement chain — if any. */
  bill: EventBill | null;
  /** Accepted registrations now; organization admins cannot list them. */
  acceptedRegistrationCount: number;
}
