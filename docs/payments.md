# Payments: registration fees

> Status: proposed, not implemented. Supersedes `feat/payments`, which is
> ported from where it fits (see [Porting](#porting-from-featpayments)).

What each registration owes, what came in, and what went back. Payments are
recorded by hand — a bank transfer seen on the statement, cash at check-in —
and the ledger lives in the Finances page, where it is the registration fees
source of [income](finances.md#income). What a registration costs is
[pricing](pricing.md); this document starts from its `quotedAmount`.

There are no payment providers yet: no checkout, no webhooks, no organization
payment accounts. The model leaves room for them (see
[Providers later](#providers-later)), but nothing ships for them now.

## Phases

1. **Fees ledger** — this document: amount due, recorded payments and
   refunds, transfer references, the treasurer's view, the fees view in
   Finances.
2. **Income** — manual income and the registration fees total, as designed
   in [finances.md](finances.md#income). Ships with phase 1's release.
3. **Reminders** (optional, may never be needed) — reminder mails to
   accepted registrations that still owe, and a public page per registration
   showing what is owed. Organizers already send the price and their bank
   details in their own templates (`{{ registration.priceWithCurrency }}`,
   `{{ registration.reference }}`), so this is only built if asked for.
4. **Providers** — online checkout through an organization's Mollie or
   Stripe account, as on `feat/payments`.

## Money

Same rules as [pricing](pricing.md#money): integer minor units plus an ISO
currency, never floats; every amount positive, direction carried by the
record. The API takes and returns minor units; only the dialogs convert.

## What a registration owes

```
Registration  … amountDueOverride?, amountDueNote?, amountDueAdjustedAt?,
              paymentReference
```

- **Derived, never stored** (`amountDue()` in `paymentBalance.ts`): the
  override, else the quote, minus what cancelling refunds took off
  (`PaymentRefund.amountDueReduction`), never below zero. Deleting such a
  refund gives the amount back by itself.
- `amountDueOverride` is set by hand with a note; `amount: null` goes back to
  the quote. Like the quote, nothing re-prices it.
- Registrations predating quotes owe nothing (`null`) until someone sets an
  amount.
- The amount due doesn't depend on the status: a pending or waitlisted
  registration may still be accepted, so its deposit isn't an overpayment.
  Totals and the "still owing" filter count accepted registrations only.

### Transfer reference

People pay by transfer, often a parent under their own name, often several
children at once, with whatever they type as the description. The treasurer
matches the bank statement to registrations by a short code instead of
guessing by name.

- `paymentReference`: the event's code and a number, `K7MX-0042`, stored
  whole and unique. The code is four characters generated with the event
  (`EventFinance.referenceCode`, unique, no `0/O/1/I`), so transfers for
  several events on one account stay apart; the number is a per-event
  counter (`lastReferenceNumber`), never reused. An event's code never
  changes, so the stored string can't go stale, and queued mails, which
  carry a registration snapshot, have it without a lookup.
- Assigned first in the registration's create transaction, which also
  queues concurrent registrations of an event on that row lock. Existing
  registrations are backfilled in the migration's SQL in the order they
  came in; existing events get codes by position.
- Mail templates get `{{ registration.reference }}`; the fees view searches
  it, case-insensitive and with or without the dash.
- It is not a secret and authorizes nothing.

## Ledger

```
Payment        id, eventId, registrationId?, source, status, amount, currency,
               method, paidOn, note?, payerName?, registrationRef,
               settlement?, createdByUserId?
PaymentRefund  id, paymentId, status, amount, refundedOn, reason?,
               amountDueReduction?, createdByUserId?
```

- **A payment** is money that arrived: `source = MANUAL`, `status = PAID`,
  `method` one of `BANK_TRANSFER`, `CASH`, `OTHER`, and `paidOn` the booking
  date as a calendar date (`DateInput`), like `Payout.paidOn`. Several
  payments per registration are normal: a deposit, then the rest.
- **A refund** is money that went back, recorded once it was sent:
  `status = REFUNDED`, `refundedOn`. A payment stays `PAID`; its refunds count
  against it and never exceed it. Refunding asks whether the amount due drops
  with it (a cancellation) or not (an overpayment); the reduction is kept in
  `amountDueReduction` and given back if the refund is deleted.
- **Corrections**: a payment or refund recorded by mistake is deleted, not
  edited — note and date excepted. Deleting a payment with refunds deletes
  them first. Everything is audited.
- **Not finance refunds.** An expense of type `REFUND` is money coming back
  for a purchase; a `PaymentRefund` is a fee going back to a registrant. UI,
  translation keys and audit actions keep the two apart ("fee refund").
- **Balance** (`common/src/utils/paymentBalance.ts`, shared with the
  frontend): paid − refunded against the amount due, as `UNPAID`, `PARTIAL`,
  `PAID`, `OVERPAID` (with the excess), `REFUNDED`, or `NOT_REQUIRED`. It
  lives on the fees projection only: `RegistrationResource` carries no
  payment data; the registration table and dialog join the fees store by id.
- **Overpayments** — a duplicate transfer, a lowered amount due — show the
  excess and offer to refund it. Refunding an overpayment never lowers the
  amount due; only the part beyond the excess can.
- **Shared funds.** Fees land in the event's funds and move nobody's
  [balance](finances.md#payouts-and-balances), cash taken by a manager
  included.

## Providers later

Phase 4 plugs in beside manual payments, not around them:

- `source` gains provider names; provider columns (`paymentAccountId`,
  `providerPaymentId`, checkout URL, expiry) are added as nullable then.
- `status` gains `OPEN`, `PENDING`, `FAILED`, `CANCELED`, `EXPIRED`, moving
  only forward. Balances already count only `PAID`, so nothing there changes.
- Refunds gain `PENDING` and `FAILED`; the balance counts pending and
  completed refunds alike from the start, so a provider refund behaves like a
  manual one. Chargebacks become a refund `kind`.
- Everything that records or removes money goes through `PaymentService`;
  reconciliation will call the same methods a dialog calls.

## Registrations and deletion

The registration module reaches payments only through
`PaymentService.settleForDeletion`, inside its delete transaction.

- **Snapshot at creation.** Every payment stores `payerName` (the
  registration's name) and `registrationRef` (its id, under which its audit
  entries stay filed) when it is recorded, so no delete path has to take one.
  `registrationId` is `SetNull`: nothing financial cascades from a
  registration.
- **Deleting one registration** that still holds money (paid − refunded)
  needs `?settlement=`: `RETAINED` (e.g. a cancellation fee) or
  `SETTLED_OUTSIDE` (refunded outside the ledger); without one the server
  refuses with `PAYMENT_SETTLEMENT_REQUIRED`. Recorded on its payments and as
  a `payment_settled` entry; it needs `event.payments.refund`. The dialog
  also offers to refund first.
- **Bulk deletion and privacy purges** ("Delete all registrations", the
  [retention purge](privacy.md)) always go through and ask for no
  settlement: privacy wins, the payments keep their snapshot. The delete
  dialog and the purge reminders name the open fee balances (outstanding,
  overpaid) so they are settled before.
- **Deleting an event** deletes its payments with it (`Cascade`), like
  expenses: the app is not the archive. The confirmation warns when there are
  payments and offers the finance export first; `EVENT_EFFECTS` on the data
  settings page gains the entry.
- **Retention.** A payment whose registration is gone keeps `payerName`
  for ten years, counted from the end of the calendar year of the payment
  and its last refund (HGB § 257, AO § 147): a 2026 payment is kept through 2036. Then the monthly `payment-record-retention` job clears it; the
  amounts stay.

## Treasurer's view

`TREASURER` holds no registration permission ([privacy.md, section 6](privacy.md)).
The fees view reads `GET /events/:eventId/payments` (and
`…/payments/registrations/:id` for one): a fixed, read-only projection — an
allowlist (`feeSelect`), its own resource, never a filter on
`RegistrationResource`. Payments of deleted registrations come with it as
`orphanedPayments`.

| Field                          | Why                              |
| ------------------------------ | -------------------------------- |
| id, `paymentReference`         | The key a transfer is matched by |
| first and last name            | Recognizing the registration     |
| contact email                  | Contacting about a payment       |
| status, created at             | Who owes, who gets money back    |
| `quotedAmount`, `amountDue`, … | What is due, adjusted and why    |
| balance, payments, refunds     | What came in and went back       |

Never `data`, files, date of birth, group or room. A payment's `payerName`
is the registration's name when it was recorded; who actually paid (a
parent) goes in its note.

## Permissions

Event scope, added with the `add-permission` skill:

| Permission              | Grants                                        |
| ----------------------- | --------------------------------------------- |
| `event.payments.view`   | the fees view, balances, the projection       |
| `event.payments.create` | record a payment                              |
| `event.payments.refund` | record and delete refunds, settle on deletion |
| `event.payments.adjust` | set the amount due; delete payments           |

| Role          | Payments         |
| ------------- | ---------------- |
| `DIRECTOR`    | everything       |
| `TREASURER`   | everything       |
| `COORDINATOR` | `view`, `create` |
| `VIEWER`      | `view`           |
| `COUNSELOR`   | nothing          |

Organization `ADMIN`s get none of it: `ORGANIZATION_EVENT_PERMISSIONS` stays
as it is.

Realtime resource `registration_fee` (`event.payments.view`), emitted on the
registration's id; changes to payments of deleted registrations invalidate
the collection.

Every action is audited on its registration: recorded and deleted payments
and refunds, adjustments and their reset, settlements. Amounts are recorded;
notes, reasons and payer names are free text and never are.

## UI

No page of its own in the navigation rail. Finances gains an **Income** tab
with a toggle: **Registration fees** (this phase) and **Other income**
(phase 2). Phone-first: cash is taken at check-in.

- **Fees.** A strip on top: expected (sum of amounts due), received,
  outstanding, overpaid. Then one row per registration: name, reference, a
  status chip, what is still open. Search by name or reference; filters by
  balance status, kept in the query (`?tab=income&status=OVERPAID`).
  Registrations owing nothing and not accepted are hidden by default.
- **Details dialog** per registration, following it live: amount due (with
  the adjustment's note), payments and refunds by date, and the actions —
  **Record payment** as the main button (the open amount prefilled, method,
  date defaulting to today), **Refund** (the excess prefilled when
  overpaid), **Adjust amount due**; deleting entries is in their menus.
- **Registrations.** The registration dialog shows the same section for
  those with registration access; table templates get payment status and
  outstanding columns, also in the CSV export.
- **Dashboard.** The attention card lists overpaid registrations and, during
  wrap-up, accepted ones still owing, linking to the filtered fees view.
- **Export.** The finance export gains a fees sheet: one row per payment and
  refund with reference, payer, method and date. Phase 2 adds the income
  sheet with fees as one source total.

## Porting from `feat/payments`

`feat/payments-v2` holds only empty files and is discarded.

- **Take**: `paymentBalance.ts` and its tests (minus chargebacks),
  `RegistrationPayments`, `payment.audit.ts`, the record / refund / adjust
  dialogs, the balance and ledger items, the status chip and table cells,
  settlement on deletion, the retention calculation, seeders.
- **Leave**: `paymentAccount/` and every provider, webhooks, reconciliation,
  checkout, holds, chargebacks, `#core/secrets`, collection timing and
  request mails, the participant payment page, the organization payments
  page, `EventPaymentsPage`, `Event.priceFrom`, and the branch's own pricing
  code — `main`'s [pricing](pricing.md) replaces it.

## Implementation (phase 1)

- [x] Schema: `Payment`, `PaymentRefund`, the registration's amount due and
      reference, `EventFinance.referenceCode` / `lastReferenceNumber`, with
      backfill SQL
- [x] `common`: entities, `paymentBalance`, `paymentReference`, permissions,
      realtime resource
- [x] Backend `payment` module: ledger service, routes, resource,
      validation, audit, permissions, realtime
- [x] Registrations: reference on create, mail token, settlement on delete
- [x] Treasurer projection endpoint
- [x] Finance export fees sheet, payer-name retention job
- [x] Unit and integration tests, permission snapshot
- [x] Dev seeder with payments
- [x] Audit log: labels for the `payment_*` / `amount_due_*` actions
- [x] Frontend: Income tab with registration fees (search by name or
      reference, filters in `?fees=`), details and record / refund / adjust
      dialogs, the fee section in the registration dialog, settlement in the
      registration delete dialog, dashboard attention items
- [x] `EVENT_EFFECTS` names the fee payments
- [ ] Warnings: open fee balances in the purge confirmation and reminders
- [ ] Table columns: payment status and outstanding, with CSV — needs a
      column source beside the registration's own fields
- [ ] E2E: record, refund, adjust, treasurer view
- [ ] `finances.md` and `privacy.md`: the bank-details work has merged, so
      they can be brought in line now

## Out of scope

Providers (phase 4), reminders and a payment page (phase 3), bank details as
a setting or a GiroCode, importing bank statements, invoices, instalment
plans, and family discounts across registrations.
