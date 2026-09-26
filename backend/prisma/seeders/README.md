# Development seed

```bash
npm run db:reset --workspace backend   # DESTRUCTIVE — drops and recreates
npm run db:seed  --workspace backend
```

The seed is built so that **one account reaches every access scenario**. Log in as `john@example.com` and every
permission combination the application can produce is one click away; the second account is a system administrator for
the moderation and administration screens.

All dates are relative to the moment the seed ran, so the flagship camp is always upcoming and its registration always
open, however old the database is.

## Accounts

| Email                    | Password         | Role  | Why it exists                                     |
| ------------------------ | ---------------- | ----- | ------------------------------------------------- |
| `john@example.com`       | `password`       | USER  | The account every scenario below is built around  |
| `admin@email.com`        | `admin-password` | ADMIN | System administrator, TOTP 2FA enabled            |
| `erika@example.com`      | `password`       | USER  | Colleague, `de-DE`; admin of Alpine Explorers     |
| `peter@example.com`      | `password`       | USER  | Colleague, `cs-CZ`                                |
| `maria@example.com`      | `password`       | USER  | Colleague, `fr-FR`                                |
| `tom@example.com`        | `password`       | USER  | Runs the organization John has nothing to do with |
| `locked@example.com`     | `password`       | USER  | Locked account                                    |
| `unverified@example.com` | `password`       | USER  | Unverified email address                          |

2FA secret for the administrator: `TMRUI6PADI7DGPJF5DPMLCWSXW32MKXM`.

## Organizations

| Organization         | Status   | John's role | What it is for                                                        |
| -------------------- | -------- | ----------- | --------------------------------------------------------------------- |
| Youth Adventures     | VERIFIED | ADMIN       | The full organization experience, plus implicit access to its camps   |
| Alpine Explorers     | VERIFIED | MEMBER      | Camp roles with **nothing** merged in — a MEMBER holds no camp access |
| Nouvelle Association | PENDING  | ADMIN       | Camps hidden, registrations refused, newsletter refuses to send       |
| Harbour Youth Trust  | REJECTED | ADMIN       | Rejection note, camps unpublished by the rejection                    |
| Coastal Camps        | VERIFIED | —           | Public camp John must be refused everywhere                           |
| Bergfreunde e.V.     | PENDING  | —           | Second entry in the administrator's moderation queue                  |

Youth Adventures also has one member who was invited by email and never registered, so the members list shows a
`PENDING` row.

## Camps

`—` in the role column means John has no manager record for that camp.

| Camp                 | Organization         | John's role        | Phase          | Notes                                                                             |
| -------------------- | -------------------- | ------------------ | -------------- | --------------------------------------------------------------------------------- |
| **Summer Camp**      | Youth Adventures     | DIRECTOR           | upcoming       | **The flagship — every child model is seeded**                                    |
| Files Camp           | Youth Adventures     | COORDINATOR        | upcoming       | File upload form; registration has not opened yet                                 |
| Autumn Retreat       | Youth Adventures     | — (org ADMIN only) | upcoming       | Only `camp.view` / `camp.edit` / `camp.managers.view`; not under "assigned camps" |
| Spring Camp          | Youth Adventures     | DIRECTOR           | recently ended | Ended recently, registration closed                                               |
| Winter Camp          | Youth Adventures     | DIRECTOR           | past           | Ended long ago, unlisted                                                          |
| Mountain Weeks       | Alpine Explorers     | COORDINATOR        | upcoming       | Pure role: no `camp.delete`, no manager administration                            |
| City Camp            | Alpine Explorers     | COUNSELOR          | ongoing        | Pure role, camp in progress                                                       |
| Simple Camp          | Alpine Explorers     | VIEWER             | upcoming       | Pure role: read-only everywhere; no registration window                           |
| Glacier Trek         | Alpine Explorers     | DIRECTOR (expired) | upcoming       | The record still exists, the access does not                                      |
| Colonie de Printemps | Nouvelle Association | DIRECTOR           | upcoming       | `public`, yet hidden and refusing registrations                                   |
| Harbour Sailing Week | Harbour Youth Trust  | DIRECTOR           | upcoming       | Unpublished by the rejection                                                      |
| Seaside Camp         | Coastal Camps        | —                  | upcoming       | In the public directory; every management route must refuse                       |

Because organization ADMINs hold `ORGANIZATION_CAMP_PERMISSIONS` on every camp their organization owns, a narrow role
under **Youth Adventures** is always widened by `camp.edit`. The unmerged roles therefore live under **Alpine
Explorers**, where John is only a MEMBER.

### The flagship camp

"Summer Camp" is the one camp with a complete set of child models:

- two countries (`gb`, `fr`) and a five-locale registration form
- 58 registrations: accepted, waitlisted, pending, plus adult counselors
- seven rooms with 40 beds, 23 of them assigned, one room left empty
- a program covering every day of the week, with A/B activity blocks
- four documents: the rules and terms its form links, in both locales, plus a public packing list and a private internal
  one
- tasks with and without an assignee, one of them overdue
- four hand-written table templates, the default message templates per country
- three sent messages with per-recipient deliveries
- stored room planner and program planner settings
- five managers, one of them expiring, plus one invited by email

### Registrations

Every registration is filled out against **its own camp's form**, question by question: only what the form shows this
registrant is answered, under the value names that form stores answers under, and the computed columns
(`first_name`, `country`, `emails`, …) are then derived from those answers exactly as the API derives them on
submission. A camp whose form asks for nothing but a name therefore has registrations that carry nothing but a name.
Files a form asks for are seeded as real uploads, and a waitlisted registration confirms the waiting-list question the
form only shows once the camp is full.

### Camp documents

Every camp whose form links a document through a `{_file.<slot>}` placeholder gets that document seeded as a real
one-page PDF in storage, in each locale the camp supports — so the consent links on the registration form resolve and
the files page has something to list. **Autumn Retreat is the exception**: its form declares a slot no file was ever
uploaded for, which is what the files page warns about.

Translated seed content (program events, room names) is narrowed to the locales the camp's countries imply, so no camp
carries a translation it cannot show.

## Newsletters

| Newsletter             | Organization         | John's role        | Subscribers | Sent |
| ---------------------- | -------------------- | ------------------ | ----------- | ---- |
| Camp Updates           | Youth Adventures     | OWNER              | 120         | 3    |
| Registration Reminders | Youth Adventures     | EDITOR             | 5           | 0    |
| Alumni Digest          | Youth Adventures     | VIEWER             | 42          | 2    |
| Board Announcements    | Youth Adventures     | — (org ADMIN only) | 14          | 1    |
| Lettre d'information   | Nouvelle Association | OWNER              | 8           | 0    |
| Alpine News            | Alpine Explorers     | — (no access)      | 31          | 2    |

"Board Announcements" is the newsletter-side counterpart of "Autumn Retreat":
John administers the owning organization but holds no manager record, so he sees the newsletter and its managers and
nothing else — no subscribers, no messages, no sending. It is reachable through the organization's newsletter list only.

"Lettre d'information" belongs to a `PENDING` organization: it can be edited and prepared freely, but sending is refused
until the organization is verified.
