# Privacy & Consent — Design

What the platform does with registrants' personal data, which GDPR obligation each
part answers, and what is still missing. Written so the app can be checked against
it and so the legal reasoning can be reviewed without reading code.

Every behavior is tagged:

- **[implemented]** — in the code today, with the place to look
- **[planned]** — designed, not built
- **[gap]** — a known shortcoming without a design yet
- **[review]** — a legal assumption the design rests on, to be confirmed by counsel

## 1. Roles

| Party                    | GDPR role                 | Responsible for                                                                             |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| Organization (organizer) | Controller                | The privacy notice, the form's questions, legal bases, retention decisions, consent wording |
| Platform operator        | Processor (Art. 28)       | Running the app, enforcing what the platform can enforce, the platform privacy policy       |
| Instance administrator   | Platform operator's staff | The platform privacy policy and imprint (`LegalDocument`), organization verification        |

- **[implemented]** The event team and the platform operator are always listed as
  recipients and cannot be unticked (`ALWAYS_RECIPIENT_KEYS`,
  `common/src/privacy/catalogue.ts`).
- **[review]** Each event belongs to exactly one organization (`Event.organizationId`),
  so the model has one controller per event. Joint controllership (Art. 26), e.g. a
  camp run jointly by a French and a German organization, cannot be expressed.
- **[gap]** The data processing agreement between platform and organization lives
  outside the app; nothing records that one was concluded.

## 2. The privacy notice (Art. 12, 13)

### Model

- **[implemented]** An organization publishes one notice; each event may publish an
  _addendum_ that adds to it. The registrant reads the composed result
  (`composePrivacyNotice`, `common/src/privacy/compose.ts`): purposes, categories and
  recipients merge by key (the event's entry wins), retention exceptions are added,
  third-country transfers are a union an event cannot undo.
- **[implemented]** Two modes (`PrivacyNoticeMode`):
  - `builder` — the organization ticks catalogue entries and the app renders the
    legal text in all five locales.
  - `free_text` — the organization writes the whole notice itself. No structural
    check, no automatic translation, and event addenda can only add free text.
- **[implemented]** Controller identity comes from the `Organization` record, the
  supervisory authority from `Organization.country` (`supervisoryAuthorities.ts`).
  The data-subject rights are fixed text, not authored.
- **[review]** For Germany the BfDI is listed and flagged `regional`, because the
  competent authority is the state (Land) authority. Confirm the rendered wording
  points registrants to the right body.
- **[review]** `free_text` notices are only as multilingual as the organization
  makes them. Art. 12 wants information the registrant can understand.

### Versioning and proof of information

- **[implemented]** Notices are append-only `PrivacyNoticeVersion` rows. Publishing
  an identical notice reuses the current version; a withdrawn addendum is a new
  (empty) version, never a deletion.
- **[implemented]** Each registration stores the organization version, event
  version and platform-policy timestamp it was submitted under
  (`Registration.organizationPrivacyNoticeVersionId` and siblings, written in
  `RegistrationService` via `getStampForEvent`). Registrations from before the
  feature have `null` and are not backfilled.
- **[implemented]** The disclosure is shown under the form while it is being filled
  in (`PrivacyNoticeDisclosure.vue`), with the full text in a dialog and a
  permanent link (`/events/:id/privacy`).

### Completeness gates

- **[implemented]** `privacyNoticeCompleteness` (`completeness.ts`) is the single
  check used by the wizard, the moderator view and the server. It requires:
  purposes; an explanation for every legitimate interest (Art. 13(1)(d)); data
  categories; an Art. 9 basis for every special category; recipients; a retention
  period; a valid retention exception setup; countries and a safeguard for
  third-country transfers; DPO contact details if a DPO is named; and details when
  automated decision-making is declared (Art. 13(2)(f)).
- **[implemented]** An incomplete notice or addendum cannot be published
  (`PrivacyNoticeService.publishOrganizationNotice` / `publishEventAddendum`). An
  addendum is checked against the _composed_ notice and only refused for gaps it
  introduces itself (`addendumGaps`).
- **[implemented]** An organization cannot be verified before its notice is
  published (`verificationBlockReason`), and the public registration endpoint
  refuses submissions for unverified organizations (`eventOrganizationVerified`
  guard, `registration.routes.ts`).
- **[implemented]** Cloning an event copies its addendum only if the target
  organization's notice covers it (`copyEventAddendum`).
- **[gap]** The notice and the form are not linked. A form can ask for health data
  that the notice never declares, and the notice can declare categories the form
  does not collect. See section 4.

## 3. Legal bases

### Art. 6(1)

- **[implemented]** All six points are selectable per purpose (`LEGAL_BASIS_KEYS`):
  contract, consent, legitimate interests, vital interests, legal obligation, public
  task (municipal youth offices).
- **[implemented]** Purpose presets suggest a basis, categories and recipients
  (`PRIVACY_PURPOSE_PRESETS`). Notable choices:
  - `photo_documentation` → legitimate interests; `photo_publication` → consent.
    Kept separate on purpose.
  - `emergency_contact` → vital interests.
  - `medical_care` and `catering` → contract (Art. 6). The Art. 9 basis is
    selected separately on the category.

### Art. 9(2) — special categories

- **[implemented]** Always special: `health`, `disability_support`, `allergies`,
  `medication`, `religion` (`SPECIAL_CATEGORY_DATA_KEYS`). Custom categories carry
  their own `special` flag.
- **[implemented]** `dietary` is _advisory_: the author is prompted, not forced
  (`ADVISORY_SPECIAL_CATEGORY_DATA_KEYS`). Vegetarian or "no mushrooms" reveal
  nothing under Art. 9; halal, kosher or an allergy do, and belong under `religion`
  or `allergies`.
- **[implemented]** Selectable Art. 9 bases (`SPECIAL_CATEGORY_BASIS_KEYS`):
  `explicit_consent` (default, pre-selected), and behind an "advanced" toggle
  `nonprofit_body` (d), `vital_interests` (c), `health_care` (h), `legal_claims` (f).
- **[review]** Deliberately excluded: (b) employment law, (e) manifestly public,
  (i) public health, (j) archiving/research — none fits an event organizer.
- **[planned]** Re-add (g) substantial public interest, with a mandatory **legal
  reference** field (new completeness gap when empty). Needed for French youth stays
  (accueils collectifs de mineurs), where regulation requires the organizer to hold
  certain health information such as vaccinations.
- **[review]** (c) vital interests covers an emergency in which the person cannot
  consent; it is not a basis for collecting health data at registration.
- **[review]** (d) not-for-profit bodies covers members and regular contacts of an
  association with a political, philosophical, religious or trade-union aim, and no
  disclosure outside it. Few camp organizers qualify for all registrants.

### Multi-country events

- **[review]** The Art. 9 basis follows the **legal framework the event runs
  under**, not the registrant's country. A stay declared as an accueil collectif de
  mineurs in France is subject to the French rules for every minor in it, German
  participants included.
- **[planned]** The basis is therefore set per event (in the addendum) and per
  category, never per country group. Within one event the basis may differ by
  category: vaccinations under (g) with the legal reference, allergies and
  medication under explicit consent. Per-group bases would reintroduce the
  "consent belongs to the wrong group" problem described in `country-groups.md`.
- **[review]** Where it is unclear whether a national rule applies, explicit consent
  for everyone is the fallback. A field the law mandates but that stays under
  consent should be marked "necessary for participation" (section 4), otherwise a
  registrant can refuse what the organizer must hold.

## 4. Consent (Art. 7, 9(2)(a))

### Today

- **[implemented]** Consent questions exist only as ordinary form questions. The
  camp preset carries `consent_rules`, `consent_general_terms_and_conditions`,
  `consent_forward_list_participants`, `consent_privacy` (photos), `newsletter` and
  `confirmation_guardian` (`backend/src/app/event/presets/camp/form.ts`).
- **[implemented]** Newsletter consent is the only consent mapped to a column:
  `eventDataType: 'newsletter_consent'` → `Registration.newsletterConsent`.
- **[gap]** The camp preset's `p_health` panel (`medical_restrictions`,
  `food_intolerance`) and the seminar preset's `dietary_requirements` ask for health
  data without any consent question.
- **[gap]** Nothing enforces consent. The platform does not know which questions
  collect special-category data, does not require a consent question for them, and
  accepts health answers whether or not any box was ticked.
- **[gap]** No proof of consent beyond the boolean in `Registration.data`: no
  timestamp of its own, no record of the wording shown (forms change), no record of
  who consented (registrant or guardian).
- **[gap]** `requiresConsentQuestion` (photos) only drives an editor hint
  (`PrivacyCategoryNotes.vue`).
- **[gap]** Withdrawal has no representation. A manager can edit or delete answers,
  but nothing records that consent was withdrawn.
- **[gap]** Newsletter import from an event (`importSubscribersFromEvent`) also
  imports registrations with `newsletterConsent = null` (no consent question in the
  form) unless the manager ticks "require consent".

### Planned: enforced consent for special categories

Applies to every form, not only the presets. Events that exist when this ships are
not changed (see "Scope").

**Classifying questions**

- A question property `privacyCategory` holds a catalogue key (`health`,
  `allergies`, …) or `none` ("confirmed not sensitive").
- A shared detector (`common/src/form/`) matches keywords in all five locales
  against each question's name, title, description, choices and placeholder.
  Every question it flags must be classified. `none` is the organizer's decision as
  controller and is audit-logged.
- The form is checked against the composed notice in both directions: a tagged
  category the notice does not declare is an error; a declared special category no
  question collects is a warning.
- **[review]** Keywords cannot catch everything. This guards against oversight, not
  against an organizer deliberately hiding what a question asks.

**The consent question — placed and worded by the organizer**

- A dedicated `consent` question type with a `consentFor` property listing the
  categories it covers. The organizer decides where it goes and what it says.
- Tagging a category offers to insert one, pre-filled with wording generated from
  the notice (what, why, who receives it, how to withdraw) in every form locale.
  The organizer may move and reword it freely.
- The platform checks, without dictating wording, that:
  - every tagged category relying on `explicit_consent` is covered by a consent
    question;
  - the consent text is non-empty in every locale the form offers;
  - the question is a single checkbox, not pre-ticked, and not merged with terms
    and conditions.
- Optional by default. The organizer can mark a category "necessary for
  participation", which makes its consent required to submit (Art. 7(4)).
- **[review]** Placement is free because answers only reach the server on submit.
  If drafts are ever saved server-side, tagged answers must not be stored before
  consent.
- **[review]** Wording quality (specific, informed, unambiguous) remains the
  controller's responsibility; the generated default is a starting point.

**Enforcement**

The form editor autosaves every change to the live `Event.form`; there is no draft.
An incomplete form is a normal state mid-edit (the health question is added before
its consent question), so saving is never refused. Enforcement sits at the
outward-facing action instead, like organization verification:

- **Form compliance** — a shared check over the form and the composed notice:
  every flagged question classified, every tagged category declared in the notice,
  every consent-based category covered by a consent question. Evaluated when
  registrations are requested, so a later notice edit is caught as well as a form
  edit.
- **Editor** — the linter shows the issues while editing; the event dashboard and
  settings show a blocking banner while the form is non-compliant.
- **Public form** — a non-compliant event refuses registrations (the registration
  endpoint guard, next to `registrationOpen` and `eventOrganizationVerified`), and
  the event page says registration is unavailable instead of showing a form that
  would fail on submit.
- **[review]** Editing a live form into a non-compliant state stops registrations
  immediately until it is fixed. Intended: collecting without a basis is not
  allowed even briefly.
- **Submission and manager edits** — refuse (422) when a tagged question relying on
  consent has an answer while its consent question is not `true`. Checked on the
  submitted data, so hidden questions do not slip through.
- Categories relying on (g) or another non-consent basis need no consent question.

**Proof (Art. 7(1))**

- A `RegistrationConsent` row per consent question: `registrationId`, `categories`,
  `granted`, `givenAt`, `withdrawnAt`, the rendered text and locale as shown, and
  who gave it (registrant or guardian).
- Written in the registration's transaction, next to the notice stamp.
- Photo and carpool-list consents use the same mechanism.

**Withdrawal (Art. 7(3))**

- Manager-only for now: "record withdrawal" sets `withdrawnAt`, deletes the answers
  in the affected categories, and writes an audit entry.
- **[review]** Withdrawing must be as easy as giving consent. A registrant can do it
  by contacting the organizer, which the consent text must say.

**Scope**

- `Event.privacyPolicyVersion` (nullable). New events get `1` and are enforced;
  existing and past events stay `null` and are neither enforced nor migrated.
- An event created from a reference event counts as new; the detector pre-fills
  suggestions so the copied form can be fixed quickly.
- Out of scope: health data registrants volunteer in general free-text fields
  (`additional_information`). Presets get a hint asking not to.

## 5. Access and leakage (Art. 5(1)(f), 32)

- **[implemented]** Registrations are guarded by `event.registrations.*`
  (`registration.module.ts`): directors and coordinators view/create/edit/delete,
  counselors view/create, viewers view. Organization admins hold no registration
  permissions (`ORGANIZATION_EVENT_PERMISSIONS`).
- **[implemented]** The SSE stream only pushes registration updates to holders of
  `event.registrations.view` (`common/src/realtime/events.ts`).
- **[implemented]** Audit logs record _which_ answer changed (`data.allergies`),
  never the value (`registration.audit.ts`), and are purged after two years
  (`AUDIT_RETENTION_DAYS`).
- **[implemented]** Notice free text is sanitized on the way in
  (`sanitizeContent` / `sanitizeAddendum`).
- **[gap]** Every role with `event.registrations.view` sees every answer, health
  data included. **[planned]** `event.registrations.health.view` and filtering of
  tagged fields out of the registration resource for everyone without it.
- **[gap]** Message templates receive the full `registration.data`
  (`template.mail.ts`), so a template can put health answers into an email; change
  emails list changed answers by label (`registration.changes.ts`). CSV export
  (`useCsvExport.ts`), table templates and the registration PDF show whatever the
  viewer can see. **[planned]** Tagged fields excluded unless the sender/viewer holds
  the health permission.

## 6. Retention and deletion (Art. 5(1)(e), 17)

- **[implemented]** The notice states a retention period (anchored at event end or
  submission) plus exceptions, which either run for their own period or until
  consent is withdrawn — the latter only for purposes resting on consent
  (`retention_exception_consent_basis` gap).
- **[implemented]** A daily job (`retention-reminder`, 06:30) emails an event's
  directors 14 days before the latest period promised to its registrants runs out,
  computed from the notice versions stamped on the registrations, not today's
  notice (`privacy-retention.service.ts`).
- **[review]** The job deliberately deletes nothing: what must be kept (an unpaid
  invoice, an insurance claim, a safeguarding matter) is the controller's judgment.
- **[implemented]** Managers delete registrations individually; files left without
  an owner are removed from storage by the file service.
- **[planned]** A shorter retention period per special category and a "purge
  sensitive answers" action the reminder links to.

## 7. Data-subject rights (Art. 15–21)

- **[implemented]** Registrants can download a copy of their own submission right
  after submitting (`RegistrationCopyDownload.vue`).
- **[gap]** No self-service access, rectification, erasure or withdrawal; all go
  through the organizer, whose contact details the notice names.

## 8. Minors (Art. 8)

- **[implemented]** The camp preset asks for guardian confirmation when the
  participant is a minor (`confirmation_guardian`).
- **[gap]** Not enforced platform-wide; a custom form can collect a minor's data
  without it. **[planned]** The consent record stores who consented.
- **[review]** Art. 8's age thresholds (16 in Germany, 15 in France) concern consent
  to information society services offered directly to a child. For camp health
  forms, consent by the guardian is assumed to be the safe default.

## 9. Requirements overview

| Obligation                             | Article           | How the app answers it                                        | Status                    |
| -------------------------------------- | ----------------- | ------------------------------------------------------------- | ------------------------- |
| Inform before collection               | 13                | Notice builder, completeness gate, disclosure under the form  | implemented               |
| Prove what was shown                   | 5(2)              | Notice versions stamped on each registration                  | implemented               |
| Intelligible, in the reader's language | 12                | Builder renders five locales; free-text mode is the author's  | implemented / review      |
| Name the supervisory authority         | 13(2)(d)          | Derived from organization country                             | implemented / review (DE) |
| Lawful basis per purpose               | 6                 | Catalogue, per-purpose basis, legitimate-interest explanation | implemented               |
| Basis for special categories           | 9(2)              | Declared in notice; (g) to be added                           | implemented / planned     |
| Explicit consent actually obtained     | 9(2)(a), 7        | Consent question type, registration gate, submission check    | planned                   |
| Proof of consent                       | 7(1)              | `RegistrationConsent`                                         | planned                   |
| Freely given                           | 7(4)              | Optional by default, "necessary" flag                         | planned                   |
| Withdrawal                             | 7(3)              | Manager action, answers deleted                               | planned                   |
| Need-to-know access                    | 5(1)(f), 32       | Role permissions; health permission and filtering             | implemented / planned     |
| Storage limitation                     | 5(1)(e)           | Retention in notice, reminder; sensitive purge                | implemented / planned     |
| Erasure                                | 17                | Manager deletion, orphan file cleanup                         | implemented               |
| Children                               | 8                 | Guardian confirmation in preset; consent record               | gap / planned             |
| Newsletter consent                     | 6(1)(a), ePrivacy | Column from form; import may include `null`                   | gap                       |
| Processor agreement                    | 28                | Outside the app                                               | gap                       |
| DPIA                                   | 35                | Outside the app (organizer)                                   | review                    |

## 10. Open questions for legal review

1. Does the per-event (not per-country-group) choice of Art. 9 basis hold for
   binational camps, and which national law decides for a German organizer running a
   stay in France?
2. Which health fields of a French accueil collectif de mineurs rest on (g), and what
   is the exact legal reference to show?
3. Is it acceptable that organizers may mark a flagged question `none`, with the
   decision logged, rather than the platform blocking it?
4. Is manager-recorded withdrawal sufficient for Art. 7(3), given that withdrawing
   takes a message to the organizer while consenting takes a click?
5. Should newsletter import ever include registrations without a recorded consent?
6. Is the German supervisory authority rendered correctly given its `regional` flag?
7. Does the platform need its own DPIA as processor, or is it the organizers' duty
   alone?
