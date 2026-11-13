# Finances: expenses, payouts and balances

> Status: proposed, not implemented. Supersedes the `feat/expenses` attempt.

What an event spent, who paid for it, and who is still owed money, so the
bookkeeping after an event takes an evening instead of a weekend. It is not
accounting software: no double-entry, no VAT, no tax reports. It produces
exports a treasurer's real tool takes from there.

Income has a tab of its own (see [Income](#income)): manual income such as
grants and donations, plus — once `feat/payments` lands — the registration
fees it collects, read from its ledger as one source. Platform billing (`EventBill`, `Invoice`) is unrelated, hence the name
"Finances", never "billing".

## Money

Same rules as [pricing](pricing.md): integer minor units plus the event's
currency (`Event.currency`), never floats or `Decimal`. Every amount is
positive; direction is part of what the record is, never a sign.

### Foreign currencies

Exchanges abroad bring receipts in PLN or CZK. An expense may carry its
**original amount** next to the amount that counts:

- `amount` is always in the event's currency; totals and balances use only
  it.
- `originalAmount` and `originalCurrency` are optional and set together: the
  minor units and ISO 4217 code printed on the receipt. Any ISO currency is
  allowed here, not just `SUPPORTED_CURRENCIES`, which only limits what an
  event charges in.
- The person enters either the converted amount or a rate; the app stores
  the result, not the rate, which is derivable. No exchange-rate service.
- The export shows both, so a funder asking for original amounts gets them.

## Categories

Every event owns its categories. There are no shared or organization-wide
lists: an organization running a funded exchange and an ordinary camp needs
different categories, and a funder's scheme (FGYO, Erasmus+) is just a list
someone typed in once, never something the code knows about.

```
ExpenseCategory  id, eventId, parentId?, name (Json), position, archivedAt?
```

- **One level of grouping.** A category with a `parentId` is a leaf; a parent
  must not have one itself. Groups exist for schemes like FGYO's eligible /
  non-eligible costs. Expenses reference leaves only.
- **Names** are translatable like event names (`string | Record<string,
string>`), limited to the event's locales. Only managers see them, so a
  single language is fine; translations are optional.
- **Copied, never referenced.** On `POST /events` with a `referenceEventId`
  the categories are cloned with the other resources
  (`cloneReferenceEventResources`); otherwise the event gets the defaults,
  generated in its locales like `defaultMessageTemplatesForCountries`. Event
  countries never change, so the copied translations stay complete.
- **Defaults** are few and generic: travel, accommodation, food, materials,
  program, other. A preset may bring its own list later.
- **Editing affects this event only.** Unused categories may be deleted; used
  ones are archived — hidden from the picker, kept on their expenses.
- **Existing events** get the defaults from a data migration, so every event
  has categories and nothing initializes lazily.

## Expenses

```
Expense  id, eventId, receiptNumber, type (EXPENSE | REFUND), amount,
         originalAmount?, originalCurrency?, date, description, categoryId?,
         paidByUserId?, paidByName?, createdByUserId
File     … expenseId?   (the receipt files)
```

- **Receipt number**: sequential per event, assigned by the server on create
  (unique `(eventId, receiptNumber)`), never reused. Deleting an expense
  leaves a visible gap. It is written on the paper receipt and is what
  funders' receipt lists go by. Receipts and payouts are numbered separately
  (see [Payouts](#payouts-and-balances)), so a funder's receipt list has no
  holes other than deleted receipts.
- **Category** is optional; the core is who paid how much.
- **Date** is the date on the receipt. Empty means the receipt is still to
  come — an invoice expected, a till slip not yet handed over. The amount
  counts all the same and the number is assigned now, to go on the paper once
  it arrives; the list badges and filters such expenses, the summary names
  them.
- **Paid by** is one of:
  - a manager (`paidByUserId`, with the name snapshotted in `paidByName` so it
    survives the manager leaving or deleting their account). The picker
    offers managers first;
  - anyone else, by name only (`paidByName`): a club, a parent ("Parents of
    Anna"), a partner organization. There is deliberately no link to a
    registration — it would tie finance records, which are kept for years,
    to participant data with a shorter life. Names already used in the
    event's expenses and payouts are suggested, since balances group by exact
    name;
  - **event funds** (both empty): the cash box or the association's account.
    Nothing is owed to anyone. There is one pot; named funds are out of scope.
- **Receipt files**: any number of images or PDFs, through the File module
  (`File.expenseId`, like the module's other owner columns), so a multi-page
  hotel invoice is several photos of one receipt. They are a convenience
  copy: the paper receipt and the export are the records (a scan only
  replaces the original under GoBD procedures, which the app doesn't claim).
  A file can be added after the expense is saved. No OCR.

### Refunds

Money coming back for something bought — returned goods, a rental or bottle
deposit — reduces that cost, so it is an expense of type `REFUND` in the
original purchase's category: a 500 € house deposit paid and returned nets
accommodation to zero, which is right, since a deposit was never a cost.

- `type` is `EXPENSE` or `REFUND`; `amount` stays positive and category
  totals subtract refunds.
- A refund gets its own receipt number: its document has to be kept too.
- **Paid by** reads as _received by_: a refund handed to a person in cash
  lowers their balance (they now hold the event's money); one to event funds
  changes no balance.
- Real income — donations, grants, fees — is never a refund. It would
  understate costs, and funders report income separately.

## Payouts and balances

Reimbursements are not negative expenses: that would zero every settled
event's costs and every category total. An expense is a cost; a payout is a
transfer between event funds and a person.

```
Payout  id, eventId, number, recipientUserId?, recipientName,
        direction (OUT | IN), amount, paidOn?, note?, signature?,
        signedAt?, createdByUserId
Event   … payoutNumberPrefix (default "P")
```

A person's **balance** = their expenses − their refunds − payouts `OUT` +
payouts `IN`, counting only payouts already made.
Positive: the event owes them. Negative: they owe the event. Zero: settled.

- **Statement first, money second.** A payout is usually agreed before it
  is made: created without `paidOn` it is "to pay" — numbered, signable —
  and moves no balance yet; the card shows it as still to transfer. Once the
  transfer is done, "mark as paid" sets the date. Cash is recorded paid
  right away.

- **Partial and multiple payouts** fall out of the sum: any number, any
  amount. "Settle" prefills the open balance; the amount stays editable.
- **Advances**: a payout `OUT` before any expense — the balance goes
  negative, expenses bring it back, returned change is a payout `IN`.
- Payouts are not tied to individual expenses. People settle in lump sums; a
  link to the covered expenses can be added if it is ever needed.
- **Recipients** are picked like payers: managers first, any name otherwise.
  People are grouped by `userId`, else by exact name. Settlements between two
  people directly never touch event funds and are out of scope.
- **Payout numbers**: their own sequence per event (unique
  `(eventId, number)`), assigned by the server and never reused, shown with
  the event's prefix: `P1`, `P2`. The prefix is an event setting, default
  `P`, editable only until the first payout exists, so printed slips keep
  matching. A payout is a document, not a cost: the summary never adds it,
  and the export lists payouts on their own sheet so no tool imports them as
  expenses.
- **Statement and signature**: a payout comes with the recipient's statement
  — every receipt they paid, refunds received, earlier payouts, this payout
  and the balance after — and their declaration that the expenses really
  occurred for the event, are correct, were not claimed elsewhere, and that
  they received (or returned) the amount. They sign it on screen, on the
  treasurer's device or their own (`PUT /payouts/:id/signature`, SVG path
  data). Changing the amount, direction or recipient clears the signature:
  they didn't sign that. Printed, the slip carries the signature, or empty
  lines to sign on paper.

## Income

Status: designed, not built. It follows expenses wherever it can, so the
payments feature only has to plug in a source.

```
Income  id, eventId, number, categoryId?, amount, originalAmount?,
        originalCurrency?, receivedOn?, description, payerName?, createdByUserId
File    … incomeId?   (grant letter, donation receipt)
Event   … lastIncomeNumber, incomeNumberPrefix (default "I")
```

- **Two sources, one view.** Manual income is its own record — never an
  expense of another type, which would mix into category totals and the
  receipt list funders get. Registration fees stay in the payments ledger
  (`Payment`, with providers and statuses); finances only reads their total,
  per payment method at most, as a read-only "Registration fees" line linking
  to the payments page. No rows are copied and no participant data shows up
  here.
- **Categories of its own**, per event, grouped and copied like expense
  categories (defaults: grants, donations, own contributions, other), so a
  funder's breakdown — FGYO's own funds and third-party funds, say — is a
  list typed in once. Expense categories are still unreleased, so they become
  `FinanceCategory` with a `kind` (`EXPENSE` | `INCOME`) instead of a second
  table; the editor shows one kind at a time.
- **Expected or received.** `receivedOn` empty means promised but not yet
  paid, like a pending receipt. The summary keeps the two apart, so the
  result is never overstated by money that hasn't arrived.
- **Shared funds only.** Income — manual, or cash a manager takes for a
  registration — always lands in the shared funds and moves nobody's
  balance; the cash box may sit in someone's bag, but it is still the
  event's money. Balances stay a sum over movements, so a "kept by a manager"
  case could join the formula later without changing anything else.
- **Numbered** in a series of its own with a prefix, like payouts, so the
  documents behind it can be filed.
- **Summary**: income per category and source, received and expected apart,
  total spent, and the result (received income − spent). The export gains an
  income sheet; registration fees appear there as their source's total.
- **Permissions**: seeing it goes with `event.expenses.view`; recording,
  changing and deleting need `event.income.create` / `.edit` / `.delete`,
  held by directors, treasurers and coordinators. Counselors record no
  income.

## Changes

Nothing is locked: every record stays editable by whoever may edit it, also
after a payout or an export, and every create, edit and delete goes to the
audit log. A payout doesn't freeze the expenses before it; a changed expense
simply reopens the balance.

## UI

A **Finances** page (`management.event.finances`) with tabs **Expenses**,
**Balances** and **Summary**, plus a toolbar menu for the category editor and
the payout prefix.

- **Capture (phone-first).** A floating button opens a full-height sheet,
  fields in the order they are at hand at the till: amount (digits only,
  cash-register style: `4780` reads `47,80`; focused), receipt photos (opens
  the camera, several allowed), description, category as chips grouped under
  their parents, paid by (defaults to me), receipt date (defaults to today,
  `DateInput`, clearable). The original currency is a toggle inside the
  amount field. Saving shows the receipt number to write on the paper, with
  "Next receipt" for a stack of them. A **Refund** toggle switches the type,
  so nobody types a minus; "Paid by" becomes "Received by".
- **Online only.** Saving needs a connection, since the server assigns the
  receipt number. Photos upload as soon as they are taken, as temporary
  files of the session. A failed save keeps the draft in `localStorage` —
  the fields and the ids of the photos already uploaded — and offers to
  retry; it survives a reload. A photo whose upload failed is not kept. No
  offline queue.
- **Expenses.** A list on phones, a table with a totals row on desktop.
  Filters: category, payer, missing receipt file.
- **Balances.** One card per person: paid, paid out, open balance, with
  **Pay out** and **Receive** actions and their payouts by number, each
  printable as a slip. Counselors see their own card.
- **Summary.** Totals per category with group subtotals, total spent, total
  still owed. Export: CSV/XLSX (expenses, payouts and category totals on
  separate sheets) plus a ZIP of receipt files named by receipt number
  (`017.jpg`, `017-2.jpg`).
- **Category editor.** Groups as headers, up/down arrows to reorder and a
  "move to" menu to regroup (the whole tree goes in one request), inline
  rename in the event's locales, delete or archive.

## Permissions

Event scope, added with the `add-permission` skill:

| Permission                                   | Grants                                  |
| -------------------------------------------- | --------------------------------------- |
| `event.expenses.create`                      | record an expense                       |
| `event.expenses.view`                        | see every expense, balance and export   |
| `event.expenses.edit` / `.delete`            | change anyone's expenses                |
| `event.payouts.view`                         | see every payout                        |
| `event.payouts.create` / `.edit` / `.delete` | record, correct and undo payouts        |
| `event.payouts.sign`                         | sign a payout (taking it back: `.edit`) |
| `event.finances.configure`                   | the category editor and payout prefix   |

A new event role, **`TREASURER`**, holds every finance permission plus
`event.view`, so the event can be opened — no registrations, no rooms, no
messages. Like the other roles it is named by function: _Kasse_ (de),
_Trésorerie_ (fr), _Skarbnik_ (pl), _Pokladna_ (cs).

The payer picker reads `GET /finances/parties` — the event's managers, the
names typed before and the requester's own id — so recording an expense
needs no `event.managers.view`.

| Role          | Finances                                                                 |
| ------------- | ------------------------------------------------------------------------ |
| `DIRECTOR`    | everything                                                               |
| `TREASURER`   | everything                                                               |
| `COORDINATOR` | everything but `event.finances.configure`                                |
| `COUNSELOR`   | `create`; `view`/`edit`/`delete:own` expenses, `view`/`sign:own` payouts |
| `VIEWER`      | nothing                                                                  |

**Own** expenses are the ones a manager recorded (`createdByUserId`) or paid
(`paidByUserId`); own payouts are the ones made to them (`recipientUserId`).
The routers declare this with `bindModel(…, { ownedBy })`, and `:own` grants
reach exactly those records. The expense, payout and balance lists take
`?view=all|own`: `all` needs the full grant, `own` (the default) also accepts
`:own`. The grants live in the expense and payout modules; the finance module
holds only `event.finances.configure`. Organization `ADMIN`s get none of it: names, amounts and receipt
photos are personal data, so `ORGANIZATION_EVENT_PERMISSIONS` stays as it is.

## Landing page

Finances joins the feature grid once it ships, not before: the page lists
what the app does today.

- **Catalogue**: a `finances` entry in `LANDING_FEATURES`
  (`components/landing/landing-features.ts`), category `planning`, icon
  `receipt_long`, after `chores`, not featured — the four wide cells stay as
  they are.
- **Preview**: a new `FeaturePreviewVariant`, `ledger`, drawn in
  `FeaturePreview.vue` like the others: a few receipt rows (`#17 Food
47,80 €`) above a balance line settling to zero, in `--md3-*` tokens.
- **Copy**: `feature.finances.*` in all five locales of `LandingFeatures.vue`
  (`title`, `text`, `detail`, `point.1`–`point.4`). English draft:
  - title: _Expenses and payouts_
  - text: _Snap the receipt at the till, and see after the event who is
    still owed what._
  - detail: _Every expense gets a receipt number to write on the paper
    copy, a category of your own, and the person who paid. Advances and
    payouts settle each person's balance to zero, each payout comes with a
    signed statement, and the export hands your treasurer the totals per
    category plus every receipt._
  - points: _Record expenses from your phone, with a photo of the
    receipt_ · _Your own categories, copied to your next event_ · _Advances,
    partial payouts and a signed reimbursement statement_ · _Export to CSV/XLSX with a
    ZIP of receipts_
- **Page copy** in `LandingPage.vue`, all five locales: the "Run the event"
  step adds settling expenses (_"Assign rooms, plan the program and duties,
  keep everyone informed and settle the expenses."_). The hero subtitle and
  `meta_description` stay as they are — they name the core, not every tool.

German copy uses "du", like the rest of the page.

## Deleting an event

Receipts usually have to be kept for about 10 years, but the app is not the
archive. Deleting an event that has expenses warns and offers the export
first; it does not block.

## Out of scope

Funder-specific report templates
(a later, generic "fill an uploaded .xlsx" export at most), budgets,
cost-splitting between people, shared or organization-wide category lists,
OCR, exchange-rate lookups, named funds (cash box vs. account), offline
capture, linking payers to registrations, and locking or closing the books.
