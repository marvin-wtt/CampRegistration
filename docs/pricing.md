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
- Forms and mail templates get the registration's group price twice:
  `price` in **major** units, for expressions, and `priceWithCurrency`
  formatted in their language, for text (`setVariables`,
  `translateEventContext`).
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
(`extractPaymentAmounts`). Only elements tagged `payment_amount` ("Affects the
price") count:

- a boolean: its `price` when answered yes;
- a select question (radio, dropdown, checkbox, tag box): the `price` of each
  selected choice;
- an expression question: its value;
- a calculated value: its value.

Never a typed answer: a tagged text or number field adds nothing, or the
registrant would set their own price. An expression over a typed answer
(`{nights} * 20`) is the organizer's rule, and the question's own validators
(minimum, maximum) bound it; the server refuses a quote above `MAX_AMOUNT_DUE`
(`assertAmountWithinLimit`), what its column can hold.

The form editor shows the price fields only on tagged questions
(`pricedQuestions.ts`), and a `price` left on an untagged question charges
nothing, so removing the tag reliably removes the price.

Questions and choices count only while visible: they are adjustments the
person sees and chooses. Calculated values are never shown and always count:
rules the organizer applies in the background. The presets waive the price
for every role but `participant` with one (`payment_team_discount`), so the
team sees no discount line, just no price.

Only events created from a preset after this change get that discount: forms
are copied into the event, and no migration adds it to existing ones, since
what `role` means is up to each form. On an existing event the team is quoted
the full price until a director adds the discount, e.g. a calculated value
tagged "Affects the price" with
`iif({role} notempty and {role} <> 'participant', 0 - {event.price}, 0)`.

The server computes it from the validated submission and stores it as
`Registration.quotedAmount`, with `Registration.currency`. It never changes:
neither a changed price, a changed form nor edited answers re-price it. Mail
templates get it like the event's price: `{{ registration.price }}` and
`{{ registration.priceWithCurrency }}`, empty on registrations from before
quotes.

## The form's total and the price check

The registration form shows the same total live (`trackAmountDue`,
`RegistrationAmountSummary`), unless the form hides it (`showPaymentTotal`),
and its Complete button says whether registering costs money
(`completeText.ts`).

On submit the form sends `displayedTotal`, the total it showed, but only if
it showed a price: the summary, or the Complete button's default label
(`amountPresented`). A form that hides the total and sets its own button text
sends none. It is **untrusted and never an amount**: `assertPriceUnchanged`
(`registration.price-check.ts`) only compares it with the server's own quote.
On a mismatch the server refuses with `REGISTRATION_PRICE_CHANGED`, and the
form asks the person to reload the page and register again. The cause is
unknown — a changed price or form, a passed date in an expression, an outdated
page after a deploy — and a fresh page fixes them all; it is rare enough that
keeping the answers isn't worth the code. Nobody is charged an amount they
were not shown.
Without a check (API clients, managers' forms) nothing is compared.
