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
  usage?: { organizations: number; events: number };
}

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
  priceModelId: string | null;
}

/**
 * - `DRAFT`: the event is running; only the start count is known.
 * - `OPEN`: finalized after the event ended and awaiting payment.
 * - `PAID` / `VOID`: settled by an administrator (a zero total is `PAID` at once).
 */
export type EventBillStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'VOID';

export interface EventBill extends Identifiable {
  eventId: string | null;
  organizationId: string;
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
  createdAt: string;
}

export interface AdminEventBill extends EventBill {
  organization: { id: string; name: string };
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
  /** The event has its own model rather than its organization's. */
  isOverride: boolean;
}
