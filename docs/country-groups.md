# Country groups: choosing the group before the form

International events run one group per country, and some event data differs
per group: the organizer, the contact, the participant limit, and files such as
the terms of service. The respondent chooses the group **before** the form
starts; from then on the group is fixed input to the form, like the locale.

## Why not infer the group from the answers

The group used to be inferred from the answers — a `country`-tagged question,
else the address's country:

- **Two implementations of one rule.** The server extracted the country from
  tagged answers; the form needed a reactive copy of the same rule to show the
  right organizer and files while it was filled in. Keeping both in step
  (several country questions, nested and hidden questions) made the binding
  large and fragile.
- **Consent could refer to the wrong group.** A respondent could fill in the
  form for Germany, accept the German terms, go back and switch to France —
  registered in the French group, having agreed only to the German terms.
- **Group and residence were conflated.** A participant of the French group may
  live in Germany; inferring the group from the address can't express that.

## Terms

A group is a country: the two are the same thing here, and a group is
identified by its country code (`de`). Groups independent of countries are out
of scope.

The two words never mix. The registration's group is `group`; `country` means
only an answered country, such as the address's
([Group and address country](#group-and-address-country)). Settings made per
group are named after it too: `files.group`, `message_templates.group`,
`chores.balance_groups`, and in code `PerGroup`, `forGroup`, `eventGroup`,
`eventGroupFields`. Only the event's list of groups keeps its name,
`event.countries`: it also decides the languages the event writes in.

## Flow

1. **Group step** on the event page, before the form:
   - Skipped when the event has a single group.
   - Preselected by a link, `/events/:eventId?group=fr`, so organizers can
     share one link per group. The choice stays in the URL, so a reload keeps
     it.
   - Each option shows the group's free places or its waiting list.
2. **The form** receives the group as fixed input. `event.group`,
   `event.organizer`, `event.contactEmail`, `event.maxParticipants`,
   `event.freePlaces` and the `{_file.<slot>}` files resolve once, like
   `event.name` does per locale.
3. **Change group** is an explicit action in the page header, never a field in
   the form. It asks for confirmation and **resets the whole form**: every
   answer was given to the old group's form — its texts, files and terms — so
   none of it carries over.
4. **Submit** sends `{ data, locale, group }`.

### Where the group is chosen

| Option                              | For                                                                                                                      | Against                                                                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First page of the survey            | One flow; form authors see it in the creator                                                                             | The group becomes an answer again: authors can edit or delete the page, a respondent can go back and change it, and `event.*` and the files are unknown while the form is built — the reactive binding this avoids |
| Dialog on entering the page         | Lightweight                                                                                                              | Not linkable unless synced to the URL; unclear state when dismissed; the back button doesn't undo it; cramped on phones                                                                                            |
| **Step on the event page** (chosen) | Linkable and reload-safe through `?group=`; the back button returns to the choice; the form never exists without a group | One more screen before the form                                                                                                                                                                                    |

The step is a state of `EventPage.vue`, not a route: without a valid `?group=`
on an event with several groups, the page shows `RegistrationGroupSelect`
instead of the form. Choosing pushes `?group=…` (a history entry, so _back_
returns to the choice). The manager override goes through the same choice.

## Registration API

- `POST /events/:eventId/registrations` takes a `group`: required when the
  event has several groups and one of `event.countries`; it defaults to the
  only group of a single-group event.
- The server builds the form with that group (`setVariables(model, event,
{ group })`) and validates the answers against it. Capacity and the waiting
  list count per group.
- **The group is never derived from answers**, including when a manager edits
  them: editing recomputes the computed columns in the registration's own
  group and locale, and those columns don't include the group.
- **Trust:** the group is user input like every answer and validated the same
  way; every rule depending on it is evaluated by the server.
- A page loaded before the group step existed sends no group and is told to
  reload. There is deliberately no fallback to the old extraction.

## Address country: strict by default

Many events only accept people from the group's own country, so by default the
address country **is** the group's country. Where residence abroad is welcome,
the form author relaxes it per question — and changing it must then never look
like a way to change the group:

| Mode               | The field shows                | Editable | When it differs from the group                                    | Server             |
| ------------------ | ------------------------------ | -------- | ----------------------------------------------------------------- | ------------------ |
| `strict` (default) | the group's country            | no       | can't differ                                                      | rejects a mismatch |
| `warn`             | the group's country, prefilled | yes      | a warning that this doesn't change the group — use _Change group_ | accepts            |
| `free`             | empty                          | yes      | nothing                                                           | accepts            |

**Configured on the question** in the survey creator: the `groupCountryMatch`
property on the `country` question type and on the `address` question, which
hands it to its nested country. The right strictness differs per question — a
participant's address can be `strict` while an emergency contact's is `free` —
so an event-wide setting would not fit.

**Implemented with SurveyJS's own logic** (`groupCountryMatch.ts`): an
expression validator comparing the answer with `{event.group}` — a warning in
`warn`, an error in `strict` — plus `defaultValueExpression: '{event.group}'`,
and for `strict` an `enableIf` that locks the field while a group is known. The
server runs the same validators, so `strict` is enforced there too, and a
warning never blocks. A `warn` warning shows as soon as the answer changes,
through the country question's own `onValueChanged`.

**Existing forms need no migration.** Country choices used to be limited to the
event's countries, so a saved form without the property already showed the
group's country; `strict` keeps that. A nationality question needs `free`.

### Country choices

A `warn` or `free` question offers **all countries, the event's first** —
a mismatch warning is only useful if the true answer can be given. Names come
from `Intl.DisplayNames`, so only ISO 3166 codes are maintained. The event's
countries are moved first when the variables are set, by one listener per
survey.

## Group and address country

Each has its own column:

|                 | Column    | API                            | Taken from                                         |
| --------------- | --------- | ------------------------------ | -------------------------------------------------- |
| Group           | `group`   | `group` (top level)            | the group step                                     |
| Address country | `country` | `computedData.address.country` | the address answer, like `street`/`city`/`zipCode` |

Group readers: capacity and the waiting list, mails and their templates and
contacts, the statistics and demographics, the chore and room planners, the
contact picker, the table's group filter and Group column, and the newsletter
import. In the frontend, `registrationHelper.group()`. Address readers: the
address block, phone number formatting and the demographics "where from" tile,
through `registrationHelper.addressCountry()`.

**Migration.** `group` is copied from `country`, which held the group until
then, and every registration of a single-group event gets that group. `country`
is not re-extracted: an older registration's `country` keeps what it showed as
the address country before, and is corrected whenever its computed columns are
recomputed.

## Managers changing a registration's group

Rare, so available but not prominent: **Change group** in the registration's
action list, for events with several groups and `event.registrations.edit`.
The dialog shows each group's free places and warns that the registrant filled
in and accepted the current group's form and terms. The change sets `group`
only: no re-validation (a `strict` address may no longer match), no status or
waiting-list change, no message. It is audited, and `PATCH` with `group` is the
only way the group changes after submission.

## Out of scope

**Recording which documents were accepted.** Resetting the form on a group
change guarantees consent belongs to the final group. When an organizer later
replaces a group's terms, nothing shows which version an older registration
agreed to; that would follow the privacy-notice pattern
(`eventPrivacyNoticeVersionId`) as a change of its own.
