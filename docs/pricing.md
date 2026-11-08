# Pricing: what a registration costs

What the registration form charges, and how the server agrees with it. It is
independent of collecting payments: every registration stores its price.

## Money

Amounts are integer **minor units** (cents) plus an ISO currency, never
floats (`common/src/utils/money.ts`). `SUPPORTED_CURRENCIES` lists what an
event can charge in: EUR only for now. Forms and their authors work in major
units; the conversion happens at the edges (`toMinorUnits`, `fromMinorUnits`).

## The price

- `Event.price` — minor units of `Event.currency`, one for every group or one
  per group (`{"de": 15000, "pl": 12000}`), like `maxParticipants`; the event
  validation requires a price for each of the event's groups. Events don't
  sort by price: it is per group, and zero may leave the cost to the form.
- In a form, `{event.price}` is the registration's group price in **major**
  units (`setVariables`), and in mail templates `{{ event.price }}` is that
  price formatted (`translateEventContext`).
- A price of zero means no base price: the form may still charge everything,
  so zero is never shown as "free". The event card shows a price only when
  every group has one above zero ("from …" when they differ). The group step
  shows none: a group is chosen by who someone is, not by its price; the
  form's total shows it before submitting.

## What a registration owes

`computeAmountDue(event, amounts, group)` (`common/src/utils/amountDue.ts`):
the group's price plus what the answers add, clamped at zero. Without a group
the event has a price for, the highest price applies, so nobody is quoted too
little. The answers add, in major units and negative for a discount
(`extractPaymentAmounts`):

- the `price` of a selected choice (radio, dropdown, checkbox, tag box) or of
  a boolean answered yes;
- the value of a question tagged `payment_amount` (an expression or number).

Only visible questions and choices count. The presets waive the price for
every role but `participant` with a `Team discount` line shown only to them.

The server computes it from the validated submission and stores it as
`Registration.quotedAmount`, with `Registration.currency`. It never changes:
neither a changed price, a changed form nor edited answers re-price it.

## The form's total and the price check

The registration form shows the same total live (`trackAmountDue`,
`RegistrationAmountSummary`), unless the form hides it (`showPaymentTotal`),
and its Complete button says whether registering costs money
(`completeText.ts`).

On submit the form sends `priceCheck.displayedTotal`, the total it showed. It
is **untrusted and never an amount**: `assertPriceUnchanged`
(`registration.price-check.ts`) only compares it with the server's own quote.
On a mismatch the server refuses with `REGISTRATION_PRICE_CHANGED` and its
quote in `details.quotedAmount`; the form asks the person to confirm that
amount and resubmits with it. Nobody is charged an amount they were not shown.
Without a check (API clients, managers' forms) nothing is compared.
