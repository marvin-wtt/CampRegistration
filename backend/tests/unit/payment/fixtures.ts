import type { Payment, PaymentRefund } from '#generated/prisma/client.js';

/** Ledger rows for unit tests, on event `event-1`'s `registration-1`. */
export const buildPayment = (overrides: Partial<Payment> = {}): Payment => ({
  id: 'payment-1',
  registrationId: 'registration-1',
  eventId: 'event-1',
  source: 'stripe',
  paymentAccountId: 'account-1',
  providerPaymentId: 'cs_1',
  status: 'OPEN',
  amount: 5000,
  currency: 'EUR',
  method: null,
  checkoutUrl: 'https://checkout',
  expiresAt: null,
  paidAt: null,
  note: null,
  createdById: null,
  payerName: null,
  registrationRef: null,
  settlement: null,
  createdAt: new Date(),
  updatedAt: null,
  ...overrides,
});

export const buildRefund = (
  overrides: Partial<PaymentRefund> = {},
): PaymentRefund => ({
  id: 'refund-1',
  paymentId: 'payment-1',
  providerRefundId: null,
  kind: 'REFUND',
  status: 'PENDING',
  amount: 1000,
  amountDueReduction: null,
  reason: null,
  notifyParticipant: true,
  createdById: 'user-1',
  refundedAt: null,
  createdAt: new Date(),
  updatedAt: null,
  ...overrides,
});
