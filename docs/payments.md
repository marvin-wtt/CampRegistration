# Payments

Participation fees are collected online through the payment provider an
**organization** connects (Mollie or Stripe), recorded manually (bank transfer,
cash), and refunded by the event's **director**. Code: `backend/src/app/payment/`.

## Model

- `PaymentAccount` — one per organization. `credentials` is an encrypted JSON
  blob (`#core/secrets`, same `STORAGE_ENCRYPTION_KEYS` as file storage but its
  own key namespace). No encryption keys → accounts can't be connected.
- `Payment` — one row per attempt or manual entry. Money is integer **minor
  units** plus an ISO currency (`Event.currency`). Status only moves forward
  (`OPEN → PENDING → PAID | FAILED | CANCELED | EXPIRED`), `PAID` is terminal.
  Kept when the registration is deleted (`registrationId → null`); an event
  with `PAID` payments can't be deleted.
- `PaymentRefund` — money going back, as ledger rows: a payment stays `PAID`.
  Pending and completed refunds count against it.
- `Registration.amountDue` — snapshot at submit: the sum of the form answers
  tagged `payment_amount`, else `Event.price`. `null` when the event didn't
  collect payments. `Registration.payment` in the API is derived from the
  ledger (`payment.balance.ts`).

## Flow

Event setting `payment` (`enabled`, `timing`, `reminderAfterDays`):

- `REGISTRATION` — `POST /registrations` opens a checkout and returns it as
  `meta.payment.checkoutUrl`; the form redirects. Waitlisted registrations pay
  once accepted.
- `ACCEPTANCE` — on acceptance, the `payment_requested` mail carries the link.

The participant's page `/events/:eventId/registrations/:registrationId/payment`
is authenticated by an HMAC token (`payment-link.ts`, `PAYMENT_LINK_SECRET`)
and is also the provider's return URL (`&returned=1`).

Checkout refuses — rather than registration — when nothing is due, the
organization is unverified or has no account, or (with `ACCEPTANCE` timing) the
registration isn't accepted yet.

## Syncing with providers

The provider is never trusted from a webhook body. `POST
/api/v1/webhooks/payments/:provider/:accountId` only learns _which_ payment
changed (verifying Stripe's signature per account), then a `payment` queue job
re-fetches it (`PaymentProvider.fetchPayment`) and `PaymentService.applySnapshot`
applies it idempotently — including every refund, so refunds made in the
provider dashboard show up too. The participant's return triggers the same
sync, which is what makes local development work without public webhooks.

Mail and realtime side effects go through `PaymentNotifier`, so exactly the
call that moved a status notifies.

## Adding a provider

Implement `PaymentProvider` (`providers/payment.provider.ts`), add the name to
`PaymentProviderName` in `common` and the class to `providers/payment.factory.ts`
(an exhaustive record — a missing entry is a compile error).

## Local testing

- `PAYMENT_FAKE_PROVIDER=true` offers a `fake` provider (key `fake_…`) with a
  hosted checkout page under `/api/v1/webhooks/payments/fake/checkout/:id`.
  Used by the e2e suite; never enable it on a real deployment.
- Mollie: a `test_` key works without webhooks (the return syncs); expose the
  backend with a tunnel to receive them.
- Stripe: connecting registers a webhook endpoint for `APP_URL`, which Stripe
  refuses for `localhost` — the return still syncs. For webhooks use
  `stripe listen --forward-to localhost:<port>/api/v1/webhooks/payments/stripe/<accountId>`.
