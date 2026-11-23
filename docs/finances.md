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
FinanceCategory  id, eventId, kind, parentId?, name (Json), position, archivedAt?
```

- **Two kinds, one table.** `kind` is `EXPENSE` or `INCOME` (see
  [Income](#income)); each kind is a list of its own, grouped within itself,
  and a record is filed under its own kind only. Only expense categories
  exist until income is built.

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
         originalAmount?, originalCurrency?, date, description, vendor?,
         categoryId?, paidByUserId?, paidByName?, createdByUserId
File     … expenseId?   (the receipt files)
```

- **Receipt number**: sequential per event, assigned by the server on create
  (unique `(eventId, receiptNumber)`), never reused. Deleting an expense
  leaves a visible gap. It is written on the paper receipt and is what
  funders' receipt lists go by. Receipts and payouts are numbered separately
  (see [Payouts](#payouts-and-balances)), so a funder's receipt list has no
  holes other than deleted receipts.
- **Category** is optional; the core is who paid how much.
- **Vendor** ("paid to"; "refunded by" on a refund) is optional free text: the
  shop or company on the receipt, for the bookkeeping and the export. It is not
  a party: nobody's balance involves it. Vendors used before in the event are
  suggested.
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
        direction (OUT | IN), amount, paidOn?, note?,
        bankAccountHolder?, bankIban?, bankBic?, signature?,
        signedAt?, statement (Json), createdByUserId
File    … payoutId?   (a scan of the slip signed on paper)
EventFinance  eventId, payoutNumberPrefix (default "P"),
              lastReceiptNumber, lastPayoutNumber
```

`EventFinance` is created with its event and kept apart from it, so handing
out a number or setting the prefix doesn't change the event's `updatedAt`.

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
- **Statement and signature**: a payout comes with the recipient's statement —
  every receipt they paid, refunds received, earlier payouts, this payout and
  the balance after — and their declaration that the expenses really occurred
  for the event, are correct and were not claimed elsewhere. It says nothing
  about the amount changing hands: the payout line already shows it, and a slip
  may be signed before the cash or transfer arrives. They sign it on screen (on phones optionally full screen, turned
  sideways where the browser allows), on the treasurer's device or their own (`PUT /payouts/:id/signature`, SVG path
  data). Printed, the slip carries the signature, or empty lines to sign on
  paper. Page breaks fall only between receipt rows (column headings repeat);
  the totals, declaration and signature stay together on one page. The slip highlights this payout's amount; the balance after it is a
  note below. It lists only what existed when the payout was created: receipts
  and earlier payouts recorded later belong to later slips. An earlier payout
  shows its paid date if it had one; one still to pay shows just its number,
  since a frozen "to pay" would go stale.

- **Bank details** (`OUT` only, optional — cash, PayPal and the like need
  none): account holder, IBAN and an optional BIC. The treasurer enters them
  with the payout, offered the person's latest account in the event behind "Add
  bank details" (never filled in unasked, since none may mean cash); the
  recipient can add or correct them when signing on screen, so the account's
  owner confirms it (`PUT /payouts/:id/signature` takes `bankAccount`, the only
  way a counselor writes them). IBANs are checked (country length, mod 97) in
  `common` and stored without spaces. They are not part of the statement and
  never make it outdated; the slip prints them next to the signature, or empty
  lines to fill in by hand. Entered with an on-screen signature they are locked
  with it (taking the signature back unlocks them); otherwise they stay editable
  until the payout is paid (`409 PAYOUT_BANK_DETAILS_LOCKED`); unmarking it
  frees them in the same save. The audit log
  records that they changed, never their values.

### Frozen statements

The slip is a document: what was printed or signed must never change by itself —
not through edited data, and not through a code update that formats or words it
differently on the next print. The guard is against mistakes, not tampering: no
hashes or certificates.

- **Frozen at creation.** Creating a payout stores its statement once in
  `Payout.statement`, and no endpoint writes it again:
  - `content` — the finished slip (`PayoutStatementContent`): formatted amounts,
    dates, receipt lines, totals and the full declaration, in the creator's
    language. Screen and print render it as is; nothing is regenerated, so an
    update can change the layout at most, never a word or a figure. The printed
    sheet's own labels follow the same language. Only what may change afterwards
    is added live: `paidOn`, the note and the signature.
  - `basis` — the raw values the statement was built from: the event's last
    receipt number at the time, receipt ids with amount and type, and earlier
    payout ids with direction and amount. Only for the outdated check below.

  The server builds both (`payout.statement.ts`): it alone sees every expense,
  while a counselor's client sees only their own. Receipts recorded later are
  told apart by number, not by time, so no clock can skew it.

- **Locked from the start.** Amount, direction and recipient are part of the
  frozen slip and can't be edited; note and `paidOn` can. Anything else is
  corrected as described below.
- **Signed** means one of two things: the on-screen signature
  (`PUT /payouts/:id/signature`), or a scan or photo of the slip signed on
  paper, attached as a file of the payout (`PATCH` with `fileIds`;
  `File.payoutId`, like receipt files). The payout number and creation date on
  the sheet match a scan to its payout. An outdated statement takes neither
  (`409 PAYOUT_STATEMENT_OUTDATED`). A signature is replaced only by removing it
  first (`409 PAYOUT_ALREADY_SIGNED`); removing it detaches any scan too. A scan
  may still get further pages. Signing and attaching lock the payout row and
  check inside the transaction, so two can't both pass. The audit log records a
  scan as `signed` and its removal as `unsigned`, each with the number of scans.
- **Deleted accounts.** Before an account goes, its expenses and payouts take
  its current name, so after the account link is cleared they still name one
  person and their statements stay current.
- **Outdated** is computed: the statement rebuilt from current data differs from
  `basis` — a listed expense's amount, type or payer changed, it was deleted, a
  receipt moved onto the recipient, or an earlier payout changed. Only the
  figures count: dating a pending receipt, rewording a description,
  recategorizing or recording a new expense doesn't, and neither does an earlier
  payout being marked paid; the slip keeps its frozen wording. If an update
  changes how a figure is computed, the worst case is a visible false alarm,
  never a silent change. Editing or deleting an expense that sits on a current
  statement warns first ("This receipt is on payout P3"), as does moving one to
  a payer whose current statement would list it.
- **Resolving it depends on whether money moved:**

  | Payout   | When outdated                                                                                                                                                                                                               |
  | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Not paid | Nothing happened yet: delete it and create a new one on the current statement.                                                                                                                                              |
  | Paid     | The transfer is a fact and stays as it is, marked "corrected later". The correction reopened the balance; it is settled by a new payout whose statement lists the current receipts and the earlier payout, so it shows why. |

  Example: P3 paid Anna 120 €, then receipt #17 is corrected from 50 € to 40 €.
  P3 stays; Anna's balance is −10 €, and P5 (`IN`, 10 €) settles it. A forgotten
  receipt works the same way in the other direction.

- **Deleting a paid payout** is only for recording errors (a duplicate, a
  transfer that never happened); its confirmation says so and suggests printing
  the slip first. The audit log keeps number, direction and amount as for every
  payout, not the statement: it records no free text.
- **Archiving** is the browser's "Save as PDF" of the print. A server-side PDF
  can come later (with in-app invoices, say) and would render the same
  `content`.

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
  list typed in once. They are `FinanceCategory` rows of kind `INCOME`, not a
  second table; the editor shows one kind at a time (`?kind=INCOME` on the
  list and reorder routes, `kind` in the body on create). The in-use guards still count expenses only:
  deleting (archive instead), regrouping and becoming a group must count
  income records too once they exist, or a used income category could be
  deleted or turned into a group.
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
  held by directors and treasurers. Coordinators and counselors record no
  income.

## Changes

Records stay editable by whoever may edit them, also after a payout or an
export, and every create, edit and delete goes to the audit log. A payout
doesn't freeze the expenses before it; a changed expense simply reopens the
balance and flags the payout statements it appears on as outdated (see
[Frozen statements](#frozen-statements)). The only lock is a payout's amount,
direction and recipient.

## UI

A **Finances** page (`management.event.finances`) with tabs **Expenses**,
**Balances** and **Summary**, plus a toolbar menu for the category editor and
the payout prefix.

During **wrap-up**, the event dashboard's attention card lists receipts without
a date for those who see every expense; it opens the Expenses tab filtered to
them (`?tab=expenses&filter=pending`).

- **Capture (phone-first).** A floating button opens a full-height sheet, fields
  in the order they are at hand at the till: amount (digits only, cash-register
  style: `4780` reads `47,80`; focused), receipt date (defaults to today,
  `DateInput`, clearable; read off the receipt with the amount, since
  yesterday's receipts are common), receipt photos (opens the camera, several
  allowed), description, category (one compact select, grouped under their
  parents and searchable, so a funder's long list doesn't fill the sheet),
  vendor (optional), paid by (defaults to me). The original currency is a toggle
  inside the amount field. Saving shows the receipt number to write on the
  paper, with "Next receipt" for a stack of them. A **Refund** toggle switches
  the type, so nobody types a minus; "Paid by" becomes "Received by".
- **Online only.** Saving needs a connection, since the server assigns the
  receipt number. Photos upload as soon as they are taken, as temporary
  files of the session. A failed save keeps the draft in `localStorage` —
  the fields and the ids of the photos already uploaded — and offers to
  retry; it survives a reload. A photo whose upload failed is not kept. No
  offline queue.
- **Expenses.** A list on phones, a table with a totals row on desktop, grouped
  by receipt date, newest first; receipts still to come go last, in the warning
  colour with an hourglass on each row. The net total leads on every screen;
  on phones the filter button sits beside it. Rows without a file or a
  category are marked; the category mark can be turned off in the finance
  settings (event setting `finances`, for events that don't sort expenses).
  Filters: category, payer, missing receipt file, missing category (while
  marked), still to come, kept in the query (`category`, `payer`, `noFile`,
  `noCategory`, `pending`) so the summary and dashboard link to them. Tapping
  a receipt opens its details — amounts, date, payer, vendor, category, the
  payout statements it is on and its files — for everyone who sees it. Like a
  payout's, the dialog follows the record live and stays open: **Edit** is the
  main button and opens on top, **Delete** is in its menu; it closes once the
  receipt is gone. Neither the list rows nor the edit form offer delete.
- **Balances.** A strip on top: still open (nothing arranged yet, by the
  cards' own status rule), agreed but not paid, what is still to come back
  (only when not zero), and how many people are settled. Then one card per
  person: the balance, then paid, refunds received,
  paid out and paid back — four figures kept apart, since each direction is its
  own record; refunds and paid back only when not zero. **Pay out** and
  **Receive** actions (the open balance's direction filled, the other quiet,
  for advances) and their payouts by number. A payout row shows one status
  word, the next step: outdated, not signed, to pay or to get back, done —
  signing ranks before paying, and the dates are in the details; tapping
  it opens its details: the amount, a row each for paid and signed with the step
  that changes it (mark as paid, open scan), the note, and the frozen statement,
  its receipts cut to five behind "show all". The next step (sign, mark as paid,
  print) is the main button with Print beside it; edit, copy link, mark as
  unpaid, upload scan, remove signature and undo are in the header menu, the payout's
  only one. The dialog follows the payout live and stays open: changes apply
  in place, signing and editing open on top and return to it, and it closes
  only once the payout is undone. **Pay out** or **Receive** fixes the direction; the dialog doesn't
  switch it. Counselors see their own card.
- **Summary.** Totals per category with group subtotals, each row linking
  to its expenses, total spent, total still owed, and the receipts still to
  complete (missing file, still to come, no category), each linking to the
  filtered list. Export: CSV/XLSX (expenses, payouts and category totals on
  separate sheets) plus a ZIP of receipt files named by receipt number
  (`017.jpg`, `017-2.jpg`), either flat or with a folder per group
  (`?folders=group`); receipts without a group stay in the root.
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
| `COORDINATOR` | `create`; `view`/`edit`/`delete:own` expenses, `view`/`sign:own` payouts |
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

Funder-specific report templates (a later, generic "fill an uploaded .xlsx"
export at most), budgets, cost-splitting between people, shared or
organization-wide category lists, OCR, exchange-rate lookups, named funds (cash
box vs. account), offline capture, linking payers to registrations, and locking
or closing the books (beyond a payout's frozen statement).
