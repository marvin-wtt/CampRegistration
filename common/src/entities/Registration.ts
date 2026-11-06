import { Identifiable } from './Identifiable.js';
import { Timestamps } from './Timestamps.js';
import { Translatable } from './Translatable.js';
import type {
  PaymentSettlement,
  RegistrationPaymentDetails,
} from './Payment.js';

export interface Registration extends Identifiable, Timestamps {
  data: Record<string, unknown>;
  computedData: {
    firstName: string | null;
    lastName: string | null;
    dateOfBirth: string | null;
    emails: string[] | null;
    phoneNumbers: string[] | null;
    role: string | null;
    gender: string | null;
    address: {
      street: string | null;
      city: string | null;
      zipCode: string | null;
      country: string | null;
    };
  };
  customData: Record<string, unknown>;
  // The group, by its country code; the address's own country is in
  // `computedData.address`.
  group: string | null;
  status: 'PENDING' | 'WAITLISTED' | 'ACCEPTED';
  locale: string;
  payment: RegistrationPaymentDetails;
  room?: Translatable | null;
  customFiles?: Record<string, string>;
}

export type RegistrationCreateData = Pick<Registration, 'data'> & {
  locale?: string | null;
  group?: string | null;
  priceCheck?: RegistrationPriceCheck | undefined;
};

/**
 * What the registration form showed as the total, sent along so the server
 * can refuse a registration whose price changed while the form was open.
 *
 * Untrusted client input and **never an amount**: it is not stored, charged
 * or shown anywhere. The server always charges what it calculates itself and
 * only compares that with `displayedTotal`; on a mismatch it refuses with
 * `REGISTRATION_PRICE_CHANGED` and its own amount, which the person must
 * confirm before resubmitting.
 */
export interface RegistrationPriceCheck {
  /** Minor units of the event currency, as displayed. */
  displayedTotal: number;
}

export const REGISTRATION_PRICE_CHANGED = 'REGISTRATION_PRICE_CHANGED';

export type RegistrationUpdateData = Partial<
  Pick<Registration, 'data' | 'customData' | 'status' | 'group'>
> & {
  customFiles?: Record<string, string | null>;
};

export interface RegistrationUpdateQuery {
  suppressMessage?: boolean | undefined;
}
// Why a registration was deleted — recorded on its audit entry. A fixed set of
// codes rather than free text, so the audit log stays free of personal data.
export const REGISTRATION_DELETE_REASONS = [
  'canceled',
  'declined',
  'duplicate',
  'test_entry',
  'other',
] as const;

export type RegistrationDeleteReason =
  (typeof REGISTRATION_DELETE_REASONS)[number];

export interface RegistrationDeleteQuery {
  suppressMessage?: boolean | undefined;
  reason?: RegistrationDeleteReason | undefined;
  /** Required while the registration holds money (paid minus refunded). */
  paymentSettlement?: PaymentSettlement | undefined;
}
