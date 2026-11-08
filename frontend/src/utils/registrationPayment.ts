import type { Registration } from '@camp-registration/common/entities';

// Without `event.payments.view` there is no balance: every predicate is false.

/** Has a fee at all. */
export function hasFee(registration: Registration): boolean {
  const status = registration.payment?.status;
  return status !== undefined && status !== 'NOT_REQUIRED';
}

/**
 * Accepted with a fee — the `payments` table and the dashboard's counts.
 * Pending and waitlisted registrations are not asked to pay.
 */
export function owesFee(registration: Registration): boolean {
  return registration.status === 'ACCEPTED' && hasFee(registration);
}

/**
 * Accepted but not paid in full. Pending and waitlisted registrations may
 * still be turned down, so they don't count as owing yet.
 */
export function paymentOpen(registration: Registration): boolean {
  const status = registration.payment?.status;
  return (
    registration.status === 'ACCEPTED' &&
    (status === 'UNPAID' || status === 'PARTIAL')
  );
}

/** Paid more than is due, whatever the registration's status: to refund. */
export function paymentOverpaid(registration: Registration): boolean {
  return registration.payment?.status === 'OVERPAID';
}

/**
 * Money went back outside the app (a dashboard refund, a chargeback):
 * reminders and checkouts wait for a manager to decide what is owed.
 */
export function paymentHeld(registration: Registration): boolean {
  return !!registration.payment?.heldAt;
}
