# Payments

Participation fees are collected online through the payment provider an
**organization** connects (Mollie or Stripe), recorded manually (bank transfer,
cash), and refunded by the event's **director**. Code: `backend/src/app/payment/`
(the ledger) and `backend/src/app/paymentAccount/` (the organization's provider
connection and the providers; it knows nothing of payments).

## Model

- `PaymentAccount` — one per organization. `credentials` is an encrypted JSON
  blob (`#core/secrets`, keyed by `SECRETS_ENCRYPTION_KEYS` — deliberately not
  the file storage keys). No encryption keys → accounts can't be connected.
- `Payment` — one row per attempt or manual entry. Money is integer **minor
  units** plus an ISO currency (`Event.currency`). Status only moves forward
  (`OPEN → PENDING → PAID | FAILED | CANCELED | EXPIRED`), `PAID` is terminal.
  Kept when the registration is deleted (`registrationId → null`); an event
  with `PAID` payments can't be deleted.
- `PaymentRefund` — money going back, as ledger rows: a payment stays `PAID`.
  Pending and completed refunds count against it.
- `Registration.quotedAmount` — what the server calculated at submission, which
  is what the form showed: `Event.price` plus what the answers add
  (`extractPaymentAmounts`), clamped at zero. Adjustments are major units,
  negative for a discount: the `price` of a selected choice (radio, dropdown,
  checkbox, tag box) or of a boolean answered yes, and the answer of a question
  tagged `payment_amount` (an expression). Only visible questions and choices
  count. Stored whether or not payments are collected, and never changed —
  people owe what they were shown. `null` only on registrations predating it.
- `Registration.amountDue` — what is owed: the quote, unless a director set it
  by hand (`amountDueAdjustedAt`, `amountDueNote`); resetting goes back to the
  quote. Neither a changed price, a changed form nor edited answers re-price
  it; the registration dialog only points out when the answers now come to a
  different total. The presets waive the price for every role but
  `participant` with a `Team discount` line shown only to them.
  `Registration.payment` in the API is derived from the ledger
  (`payment.balance.ts`).

### The price check

The registration form sends `priceCheck.displayedTotal`, the total its summary
showed. It is **untrusted and never an amount**: `assertPriceUnchanged`
(`registration.price-check.ts`) only compares it with the server's own quote
before anything is created, and it goes no further — the service's input type
has no field for it, and tests assert it never reaches the registration. On a
mismatch the server refuses with `REGISTRATION_PRICE_CHANGED` and its quote in
`details`; the form shows that amount and resubmits only once the person
confirms it, so a client and server that calculate differently can't block
registrations either.

## Flow

Event setting `payment` (`enabled`, `timing`, `requestDate`,
`requestDaysBeforeStart`, `reminderAfterDays`):

Only accepted registrations are ever asked to pay, and only while `enabled`.
Registrations accepted before payments were turned on (or before a request
date) are asked with one deliberate step: `POST /events/:eventId/payments/request`,
offered on the payment settings page with the count from `…/payments/status`.

- `ACCEPTANCE` — on acceptance, the `payment_requested` mail carries the link.
  A registration accepted on submit (automatic confirmation) also gets a
  checkout, returned as `meta.payment.checkoutUrl`; the form redirects.
- `DATE` / `BEFORE_START` — like `ACCEPTANCE`, but not before `requestDate`
  or `requestDaysBeforeStart` days before the start (`paymentRequestDate` in
  `common`, a calendar date in the event's time zone). The daily
  `payment-reminders` job first sends the requests that came due, then the
  reminders; checkout refuses until then.

A director (`event.payments.adjust`) can set what a registration owes
(`PUT …/payments/amount-due`, with a note); `amountDueAdjustedAt` then keeps
edited answers from recalculating it until it is reset with `amount: null`.

Every payment action is audited on its registration (`payment.audit.ts`):
recorded, deleted and refunded payments, requests, adjustments, and provider
status changes as system entries. Amounts are recorded; notes, reasons and
methods are free text and never are.

The participant's page `/events/:eventId/registrations/:registrationId/payment`
is authenticated by an HMAC token (`payment-link.ts`, `PAYMENT_LINK_SECRET`)
and is also the provider's return URL (`&returned=1`).

Checkout refuses — rather than registration — when nothing is due, the
organization is unverified or has no account, or the registration isn't
accepted or asked to pay yet.

### Overpayments

More than is due can arrive: an old checkout paid after a cash payment, a
typo when recording one, an amount due lowered afterwards. The balance then
reads `OVERPAID` with the excess as `overpaid`, and the payments tab offers
to refund it. `closeStaleCheckouts` narrows the window by cancelling open
checkouts worth more than is outstanding — on a new checkout, a recorded
payment, a changed amount due, and a provider payment arriving — but it is
best effort: Mollie can't cancel every method, and a checkout being paid
right now may still go through. Refunding an overpayment never lowers the
amount due; only the part of a refund beyond the excess can.

## Deleting registrations

Payments outlive their registration as the accounting record: each keeps a
snapshot taken when it is created — `payerName` and `registrationRef` (the
registration's id, under which its audit entries stay filed) — while
`registrationId` becomes `null`. A registration still holding money (paid
minus refunded) can only be deleted with a `paymentSettlement`, recorded on its
payments and in the deletion's audit entry: `retained` keeps the money (e.g. a
cancellation fee), `settled_outside` books the rest as refunded outside the
app. Without one the server refuses (`PAYMENT_SETTLEMENT_REQUIRED`); the
dialog also offers to refund first.

The event's payment ledger (`/management/events/:eventId/payments`) lists all
of them, deleted registrations included, and exports CSV for the treasurer.

Keeping them rests on a legal obligation (Art. 6(1)(c) GDPR; Germany: HGB
§ 257, AO § 147). The monthly `payment-record-retention` job removes the payer
snapshot of payments whose registration is gone once
`PAYMENT_RECORD_RETENTION_YEARS` (default 10) have passed; the anonymous
amounts stay.

## Reconciling with providers

The provider is never trusted from a webhook body. `POST
/api/v1/webhooks/payments/:provider/:accountId` only learns _which_ payment
changed (verifying Stripe's signature per account), then a `payment` queue job
re-fetches it (`PaymentProvider.fetchPayment`) and
`PaymentReconciliationService.applySnapshot` applies it idempotently — including every refund, so refunds made in the
provider dashboard show up too. The participant's return triggers the same
reconciliation, which is what makes local development work without public webhooks.

Mail and realtime side effects go through `PaymentNotifier`, so exactly the
call that moved a status notifies.

## Adding a provider

Implement `PaymentProvider` (`paymentAccount/providers/payment.provider.ts`),
add the name to `PaymentProviderName` in `common` and the class to
`paymentAccount/providers/payment.factory.ts`
(an exhaustive record — a missing entry is a compile error).

## Local testing

- `PAYMENT_FAKE_PROVIDER=true` offers a `fake` provider (key `fake_…`) with a
  hosted checkout page under `/api/v1/webhooks/payments/fake/checkout/:id`.
  Used by the e2e suite; never enable it on a real deployment.
- Mollie: a `test_` key works without webhooks (the return reconciles); expose the
  backend with a tunnel to receive them.
- Stripe: connecting registers a webhook endpoint for `APP_URL`, which Stripe
  refuses for `localhost` — the return still reconciles. For webhooks use
  `stripe listen --forward-to localhost:<port>/api/v1/webhooks/payments/stripe/<accountId>`.
