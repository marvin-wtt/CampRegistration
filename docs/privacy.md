# Privacy & Consent — Design

What the platform does with registrants' personal data, which GDPR obligation each
part answers, and what is still missing. Written so the app can be checked against
it and so the legal reasoning can be reviewed without reading code.

Every behavior is tagged:

- **[implemented]** — in the code today, with the place to look
- **[planned]** — designed, not built
- **[gap]** — a known shortcoming without a design yet
- **[review]** — a legal assumption the design rests on, to be confirmed by counsel

**Design principle.** Build only what the law requires or what has clear practical
value. Reuse existing structures — form data, the versioned privacy notice, the
audit log, the retention reminder — before adding tables, columns, timestamps or
automation. Every planned item below names the requirement that justifies it.

Scope: registrants and the people named in a registration. Platform accounts
(managers, organization members) are covered by the platform privacy policy and
only appear here where they touch registrant data.

## 1. Roles

| Party                    | GDPR role                 | Responsible for                                                                          |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------- |
| Organization (organizer) | Controller                | The privacy notice, the form's questions, legal bases, retention decisions, consent text |
| Platform operator        | Processor (Art. 28)       | Running the app, enforcing what the platform can enforce, the platform privacy policy    |
| Instance administrator   | Platform operator's staff | The platform privacy policy and imprint (`LegalDocument`), organization verification     |

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
  (`composePrivacyNotice`, `common/src/privacy/compose.ts`):
  - purposes, categories and recipients merge by key, and the event's entry wins,
    so an event may restate an organization entry with a different basis;
  - the event's retention period replaces the baseline, its exceptions are added;
  - third-country transfers are a union an event cannot undo;
  - the event's free text stays a section of its own.
- **[gap]** An event can inherit or override an organization entry, but not drop
  one. A seminar of an organization whose camps collect health data declares health
  data too. See "Event exclusions" below.
- **[implemented]** Two modes (`PrivacyNoticeMode`):
  - `builder` — the organization ticks catalogue entries and the app renders the
    legal text in all five locales.
  - `free_text` — the organization writes the whole notice itself. No structural
    check, no automatic translation.
- **[implemented]** Controller identity comes from the `Organization` record, the
  supervisory authority from `Organization.country` (`supervisoryAuthorities.ts`).
  Data-subject rights, the complaint right and the data-provision statement are fixed
  text, not authored.

### Event exclusions

Art. 13 and Art. 5(1)(a) ask for the processing that actually happens. The
organization notice is the union of all its events, so an event inheriting it
whole over-declares. Each inherited entry gets three states — inherit, override,
exclude — inside the existing addendum. No per-event notice, no new table.

- **[planned]** One optional addendum field, stored in the same versioned JSON:

  ```ts
  excluded?: {
    purposes?: PrivacyPurposeRef[]; // also retention exceptions with that scope
    dataCategories?: PrivacyDataCategoryRef[];
    recipients?: PrivacyRecipientKey[];
    transferCountries?: string[];
  } | null;
  ```

- **[planned]** `composePrivacyNotice` removes excluded organization entries before
  merging the event's own, so the order is: organization → minus exclusions → plus
  event entries (an event entry with the same key is an override, as today).
- **[planned]** Per part of the notice:

  | Part                     | Inherit | Override                 | Exclude                                                   |
  | ------------------------ | ------- | ------------------------ | --------------------------------------------------------- |
  | Purposes                 | yes     | by key (basis, interest) | by key                                                    |
  | Data categories          | yes     | by key (Art. 9 basis)    | by key                                                    |
  | Recipients               | yes     | by key (name, country)   | by key, except `ALWAYS_RECIPIENT_KEYS`                    |
  | Retention period         | yes     | replaced (today)         | no — a notice always needs one                            |
  | Retention exceptions     | yes     | by scope (today)         | with the purpose ref of their scope                       |
  | Third-country transfers  | yes     | safeguard, note (today)  | by country, unless a remaining recipient is located there |
  | DPO, automated decisions | yes     | no                       | no — organization-level facts                             |
  | Organization free text   | yes     | no                       | no — see the gap below                                    |

- **[planned]** Retention exceptions share the purpose vocabulary (`scope`), so
  excluding a purpose also drops the exception scoped to it, and a `custom:` scope
  is excluded by its ref. No second list, and an excluded consent purpose never
  leaves a consent-bound exception behind (`retention_exception_consent_basis`).
  An event that drops a purpose but must keep its statutory exception restates the
  exception.
- **[planned]** Transfers: `countries` is the organization's minus the excluded ones,
  plus the event's. A country stays whenever a composed recipient names it, so
  excluding a country can never hide a transfer that a listed recipient causes.
  `enabled` is false and the safeguard drops when no country remains.
- **[planned]** Mandatory entries. The organization can mark a purpose, category or
  recipient "applies to every event" (`allEvents: true` on the entry, default
  false). Together with `ALWAYS_RECIPIENT_KEYS` these cannot be excluded.
- **[planned]** Two layers, so a notice cannot become false by construction at any
  time:
  - composition _ignores_ an exclusion that may not apply (mandatory entry, always
    recipient, country in use), so an organization flagging an entry later reaches
    events that excluded it earlier;
  - publishing _refuses_ such an exclusion (422, like structured entries under a
    free-text notice), so the author is not misled.
- **[planned]** On publish the server normalizes exclusions: it drops exclusions of
  keys the current organization notice does not declare, and of keys the event
  restates (restating wins). An entry the organization adds later is therefore
  inherited, never silently hidden — over-declaring is the safe failure.
- **[planned]** Completeness stays one function. `addendumGaps` already checks the
  composed notice and reports only the gaps the event introduces, so excluding the
  last purpose, category or recipient blocks publishing with the existing gaps. No
  new gap codes.
- **[planned]** Exclusions count as structured entries: under a free-text
  organization notice they are refused (`hasStructuredEntries`) and stripped when
  cloning (`publishableAddendum`).
- **[planned]** Versioning needs no change: exclusions are part of the addendum
  content, so publishing appends a version, identical content is reused, and the
  stamp on the registration proves what was hidden. Versions without `excluded`
  compose as before. The retention reminder reads the composed notice and follows.
- **[planned]** Cloning copies exclusions with the addendum; normalization against
  the target organization drops those it does not declare.
- **[planned]** Exclusions versus the form. Once questions are tagged (section 5),
  an excluded category that the form collects is undeclared, so the registration
  gate refuses registrations — no separate check. Until then, the editor warns when
  an excluded category matches a form `eventDataType` suggestion.
- **[review]** For purposes and recipients the platform cannot see whether the
  processing happens; excluding rests on the event team, acting for the controller.
  The organization's tool is `allEvents`.
- **[gap]** Organization free text (`additional`) and a whole free-text notice cannot
  be excluded in part. Prose that applies to some events only belongs in the event
  addenda. No change planned.
- **[gap]** An exclusion keeps applying if the organization removes an entry and
  later adds the same key again without the event republishing in between. Rare;
  `allEvents` covers the case that matters.
- **[gap]** Independent of exclusions, a recipient's `country` is not checked
  against the transfer list today; a recipient outside the EEA can be declared
  without a transfer.

### Versioning and proof of information

- **[implemented]** Notices are append-only `PrivacyNoticeVersion` rows. Publishing
  an identical notice reuses the current version; a withdrawn addendum is a new
  (empty) version, never a deletion. There is no server-side draft: unpublished
  edits live in the author's browser.
- **[implemented]** Each registration stores the organization version, event
  version and platform-policy timestamp it was submitted under
  (`Registration.organizationPrivacyNoticeVersionId` and siblings, written in
  `RegistrationService` via `getStampForEvent`). Registrations from before the
  feature have `null` and are not backfilled.
- **[implemented]** The disclosure is shown under the form while it is being filled
  in (`PrivacyNoticeDisclosure.vue`), with the full text in a dialog and a
  permanent link (`/events/:id/privacy`).
- **[gap]** The platform privacy policy is a single `LegalDocument` row overwritten
  on every edit (`LegalService.upsertDocument`); registrations record only its
  `updatedAt`. Low priority: the organization's notice, which carries the processing
  of registrant data, is fully versioned. **[review]** whether the platform policy
  needs the same.

### Completeness gates

- **[implemented]** `privacyNoticeCompleteness` (`completeness.ts`) is the single
  check used by the wizard, the moderator view and the server. It requires:
  - purposes, and an explanation for every legitimate interest (Art. 13(1)(d));
  - data categories, and an Art. 9 basis for every special category;
  - recipients and a retention period;
  - a valid retention exception setup;
  - countries and a safeguard for third-country transfers;
  - DPO contact details if a DPO is named;
  - details when automated decision-making is declared (Art. 13(2)(f));
  - labels on custom entries; in `free_text` mode, any text at all.
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
  that the notice never declares. See section 5.

## 3. The notice builder

### Authoring

- **[implemented]** Organization wizard (`OrganizationPrivacyPage.vue`), six steps:
  controller (read from the organization record), data, purposes, recipients,
  retention (also transfers, DPO, automated decisions —
  `PrivacyRetentionStep.vue`), additional text. The stepper marks the step a gap
  belongs to (`PRIVACY_NOTICE_GAP_SECTIONS`).
- **[implemented]** Ticking a purpose adds its preset basis, categories and
  recipients (`PRIVACY_PURPOSE_PRESETS`); unticking never removes them again.
- **[implemented]** Special categories pre-select explicit consent; the four other
  Art. 9 bases sit behind "use a different legal basis", each with the condition
  under which it applies (`SpecialCategoryBasisField.vue`,
  `privacy.specialCategoryCondition`).
- **[implemented]** Category hints (`PrivacyCategoryNotes.vue`): `dietary` explains
  when to also tick `religion` or `allergies`; `photos` says the form needs a
  consent question of its own.
- **[implemented]** Event addendum editor (`EventPrivacyPage.vue`) shows the
  organization baseline, marks each entry's origin (`OriginChip.vue`), can hide
  inherited entries, and suggests categories from the form's `eventDataType` tags
  (`EVENT_DATA_TYPE_DATA_CATEGORIES`) — identity, contact, address, date of birth,
  gender only. "Hide inherited" is a view filter; inherited entries are locked and
  cannot be removed.
- **[planned]** Each inherited entry gets inherit / override / exclude in the event
  editor, with exclusion unavailable for mandatory entries and always-recipients
  (section 2, "Event exclusions"). Excluded entries stay visible, struck through,
  so the editor shows the whole organization baseline.
- **[implemented]** Preview renders the unpublished state exactly as registrants
  will read it (`PrivacyPreviewDialog.vue`); the publish card shows the live version
  and unpublished changes (`PrivacyPublishCard.vue`).

### Rendered notice (`PrivacyNotice.vue`)

Sections in order: controller; what we collect (with the Art. 9 basis per special
category); purposes with Art. 6 basis and legitimate interest; recipients; retention
with exceptions and a statutory-retention note; transfers; DPO; automated
decision-making; organization free text; event free text; whether data has to be
provided; rights (Art. 15–18, 20, 21, 7(3)) with conditions for objection and
withdrawal; complaint and supervisory authority.

### Evaluation

Strong points: the catalogue keeps the notice translatable and structurally
checkable; one completeness function serves client and server; stamped versions
make the information given provable; the always-present recipients and the
consent-bound retention check prevent notices that are false by construction.

Findings, most important first:

1. **Event additions under a free-text organization notice.** Composition drops
   structured entries in `free_text` mode, so an event could publish a health
   category no registrant sees. **[implemented]** The event editor offers free text
   only in that mode and warns about entries left from before the switch, which
   publishing removes (`publishableAddendum`, `hasStructuredEntries`,
   `common/src/privacy/content.ts`). The server refuses structured entries under a
   free-text notice, and cloning copies only the text (`PrivacyNoticeService`).
2. **Art. 13(2)(e).** **[implemented]** The fixed text says required fields are
   needed to process the registration and makes no promise about acceptance. When
   a purpose rests on a legal obligation (Art. 6(1)(c)), it adds that the data for
   those purposes is required by law (`PrivacyNotice.vue`). **[planned]** The same
   for categories on Art. 9(2)(g), once that basis exists.
3. **Supervisory authority for Germany.** The BfDI was named, who is not competent
   for associations or companies. **[implemented]** For countries flagged
   `regional` the notice names no body: it says the authority of the region where
   the organization is established is competent and links the Datenschutzkonferenz
   list of all authorities (`supervisoryAuthorities.ts`). No per-state mapping.
4. **Art. 13(1)(f).** **[implemented]** For standard contractual clauses and binding
   corporate rules, the notice says a copy can be requested from the controller's
   contact address. Adequacy decisions are public; derogations have no copy.
5. **[gap] Translations are not checked per locale.** `isBlank` accepts a
   `Translatable` when any locale has text, so an authored explanation may exist in
   German only while the event is offered in French (Art. 12). **[planned]** Require
   text in every locale the organization's events are offered in.
6. **[review] Categories, purposes and recipients are unlinked in the output.** The
   reader cannot tell that allergies go to the caterer and medication only to the
   medical staff. Art. 13 does not strictly demand the link; no change planned.
7. **[review] Third persons named in a registration** (emergency contacts) are
   informed under Art. 14, not 13. Whether Art. 14(5) applies is open.
8. **[review] Art. 21(4).** The right to object must be presented clearly and
   separately; it is a list item plus a note.
9. **[planned] The `photos` consent hint** says registering must always stay
   possible without consent; reword it once the "necessary for participation"
   option of section 5 exists.
10. **[review]** Church organizations under KDG / DSG-EKD have their own law and
    authorities; the notice cites GDPR only.
11. **[gap] Events over-declare.** Every event inherits all organization entries and
    cannot drop any. **[planned]** Event exclusions (section 2).

## 4. Legal bases

### Art. 6(1)

- **[implemented]** All six points are selectable per purpose (`LEGAL_BASIS_KEYS`):
  contract, consent, legitimate interests, vital interests, legal obligation, public
  task (municipal youth offices).
- **[implemented]** Notable preset choices:
  - `photo_documentation` → legitimate interests; `photo_publication` → consent.
    Kept separate on purpose.
  - `emergency_contact` → vital interests.
  - `medical_care` and `catering` → contract (Art. 6); the Art. 9 basis is chosen
    separately on the category.

### Art. 9(2) — special categories

- **[implemented]** Always special: `health`, `disability_support`, `allergies`,
  `medication`, `religion` (`SPECIAL_CATEGORY_DATA_KEYS`). Custom categories carry
  their own `special` flag.
- **[implemented]** `dietary` is advisory: the author is prompted, not forced
  (`ADVISORY_SPECIAL_CATEGORY_DATA_KEYS`). Vegetarian or "no mushrooms" reveal
  nothing under Art. 9; halal, kosher or an allergy do.
- **[implemented]** Selectable bases (`SPECIAL_CATEGORY_BASIS_KEYS`):
  `explicit_consent` (default), and behind "advanced" `nonprofit_body` (d),
  `vital_interests` (c), `health_care` (h), `legal_claims` (f).
- **[review]** Deliberately excluded: (b) employment law, (e) manifestly public,
  (i) public health, (j) archiving/research — none fits an event organizer.
- **[planned]** Re-add (g) substantial public interest, with a mandatory **legal
  reference** field (new completeness gap when empty).
- **[review]** French youth stays (accueils collectifs de mineurs): regulation is
  understood to require the organizer to hold certain health information such as
  vaccinations, which would rest on (g). Not assumed valid until confirmed: which
  fields, which provision, and whether it extends beyond what the regulation names.
- **[review]** (c) vital interests covers an emergency in which the person cannot
  consent; it is not a basis for collecting health data at registration.
- **[review]** (d) not-for-profit bodies covers members and regular contacts of a
  body with a political, philosophical, religious or trade-union aim, and no
  disclosure outside it. Few camp organizers qualify for all registrants.

### Multi-country events

- **[review]** The Art. 9 basis follows the legal framework the event runs under,
  not the registrant's country. A stay declared as an accueil collectif de mineurs
  in France would be subject to the French rules for every minor in it.
- **[planned]** No new mechanism: the basis is set per event in the addendum, which
  can already override an organization entry, and per category — never per country
  group (see `country-groups.md` for why group-dependent consent is fragile).
- **[review]** Where it is unclear whether a national rule applies, explicit consent
  for everyone is the fallback.

## 5. Consent (Art. 7, 9(2)(a))

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
  collect special-category data and accepts health answers whether or not any box
  was ticked.
- **[gap]** The wording of any consent question — photos, carpool list, newsletter —
  cannot be proven: the form editor autosaves into the live `Event.form`, so the text
  a registrant saw is overwritten by the next edit.

### Planned: consent questions and special categories

Applies to every form, not only the presets. Justified by Art. 9(1) (processing
without a basis is prohibited) and Art. 7(1) (the controller must be able to
demonstrate consent).

**Tagging — two question properties, both set by the organizer**

- `privacyCategory` on a data question: the catalogue key it collects (`health`,
  `allergies`, …).
- `consent: true` on a consent question: its wording is copied into the registration
  (see "Proof"). Used by every consent — photos, carpool list, newsletter, health.
- `consentFor` on a consent question, optional: the special categories it unlocks.
  Only these feed the registration gate and the submission check.
- Not `eventDataType`: it holds one value and maps to registration columns, and the
  newsletter question already uses it (`newsletter_consent`).
- `consent` and `consentFor` stay separate so a consent that is not about a special
  category (the carpool list shares contact data) does not gate every contact
  question.
- The presets tag their own data and consent questions.

**Classification — organizer-controlled**

- A question property `privacyCategory` holds a catalogue key (`health`,
  `allergies`, …). The organizer sets it; it is the source of truth.
- **Optional aid:** a keyword hint in the form editor's linter (five locales, names,
  titles and choices) suggests `privacyCategory` for untagged data questions and
  `consent` for boolean questions that read like consent ("agree", "einverstanden",
  "j'accepte"). A warning only — it never blocks saving or registrations, and
  dismissing it needs no record.
- **[review]** Tagging rests on the organizer, as controller. The platform enforces
  consequences of what is tagged; it does not try to discover what is not. An
  untagged consent question gets no wording copy.

**Consent wording — in the form**

- The organizer writes the consent question in the form editor and decides where
  it goes. Wording, placement and translations stay with the organizer.
- When tagging a special category, the editor can offer a default consent question
  generated from the notice (what, for which purpose, who receives it, how to
  withdraw), freely editable.

**Scope of one consent**

- One consent may cover closely related categories serving one purpose — e.g.
  health, allergies and medication for medical care during the event.
- Unrelated purposes stay separate: photo publication, the carpool list and the
  newsletter each keep their own question, and no consent is merged with the terms
  and conditions (Art. 7(2)).
- **[review]** Where exactly "closely related" ends is a legal judgment; the default
  texts follow one-purpose-per-consent.

**Proof (Art. 7(1))**

| What must be shown       | Where it comes from                                                   |
| ------------------------ | --------------------------------------------------------------------- |
| The affirmative choice   | The consent answer `true` in `Registration.data`                      |
| When                     | `Registration.createdAt` for consent given at submission              |
| The exact wording        | `Registration.consentTexts`, in the language of `Registration.locale` |
| Who consented            | The registrant, or the guardian via `confirmation_guardian` answers   |
| Changes after submission | The audit log (`registration.audit.ts`) — who, when, which field      |

- **[planned]** One nullable JSON column, `Registration.consentTexts`, keyed by
  question name: `{ "consent_privacy": "I agree that photographs of …" }`. The only
  schema change consent needs (skill: `prisma-migration`); existing registrations
  stay `null`, like the notice stamp.
- **The server copies the text**, never the client. `registration.form.ts` already
  builds the survey server-side in the registration's locale with the event
  variables set; it reads each tagged question's title and description with
  placeholders filled in (`{first_name}`). The description is included because it
  often carries the legally relevant part ("voluntary, can be revoked at any time").
- Copied when a consent answer becomes `true` — at submission, or when a manager
  records a consent given on paper (timed by its audit entry, not `createdAt`). A
  withdrawal leaves the copied text in place: it still shows what was consented to,
  and the audit log shows the withdrawal.

**Stale forms — compare the consent texts, like the price**

The form may change between opening and submitting: the editor autosaves, and live
forms get edited while registration is open. Copying the server's current text would
then record wording the registrant never saw.

- On submit, the client sends the texts of the tagged consent questions it displayed,
  next to the displayed total it already sends for `assertPriceUnchanged`.
- The server renders the same questions from the current form and compares:
  - equal — the server's text is stored;
  - different — refused with a conflict; the client reloads the form, keeps the
    answers and asks the registrant to review the changed consent before submitting,
    mirroring the existing `priceChanged` state.
- Only consent texts are compared, not the whole form: unrelated edits do not
  interrupt anyone filling in a form. No form versioning, no hash — the texts are
  short.
- Compared as processed text (placeholders filled, before Markdown): the client adds
  a Markdown renderer the server does not have (`addMarkdownRenderer`), so rendered
  HTML may differ for identical text.
- **[review]** A link inside a consent text (`{_file.rules}`) is compared as the link,
  not as the document behind it. Replacing the linked file is not detected.
- **[review]** Audit entries are purged after two years (`AUDIT_RETENTION_DAYS`).
  Proof of a later change must not be needed longer than that, or the registration
  is deleted earlier anyway.

**Mandatory consent (Art. 7(4))**

- Optional by default. The organizer can mark a consent "necessary for
  participation", which makes it required to submit.
- **[review]** Whether consent may be a condition of participation when the data is
  needed for the person's safety (e.g. allergies at a catered camp) is not assumed;
  the option ships with a warning until confirmed.

**Enforcement**

The form editor autosaves; an incomplete form is a normal state mid-edit, so saving
is never refused. Enforcement sits at the outward-facing action, like organization
verification:

- **Registration gate.** An event refuses public registrations while a tagged
  category relying on `explicit_consent` has no consent question covering it, or a
  tagged category is not declared in the notice with an Art. 9 basis. Same guard
  chain as `registrationOpen` / `eventOrganizationVerified`; the event page says
  registration is unavailable. The editor and event dashboard show why.
- **Submission and manager edits.** Refuse (422) when a tagged question relying on
  consent has an answer while its consent is not `true`. Checked on the submitted
  data, so hidden questions do not slip through.
- Categories relying on (g) or another non-consent basis need no consent question.
- **[review]** Editing a live form into a non-compliant state stops registrations
  until it is fixed. Intended: collecting without a basis is not allowed even
  briefly.

**Withdrawal (Art. 7(3)) — manager workflow**

- The registrant withdraws by contacting the organizer; the consent text and the
  notice say how.
- **[planned]** A manager action "withdraw consent" on a registration sets the
  consent answer to `false` and deletes the answers in the categories its
  `consentFor` covers. The existing audit entry records who did it and when.
- Handled without undue delay; the event's managers are responsible.
- **[review]** Art. 7(3) requires withdrawing to be as easy as giving consent.
  Consent is a click; withdrawal is an email followed by a manager's action. Whether
  that is sufficient is uncertain. A self-service withdrawal is not planned until
  this is answered.

**Scope and legacy events**

- Enforcement applies to events created after the release; existing and past events
  are not changed. The cutoff is a release date compared with `Event.createdAt`
  (null on the oldest events, which counts as legacy) — no new column.
- An event created from a reference event counts as new and must pass the gate.
- **[planned]** Legacy events that still accept registrations are reviewed, not
  migrated: their managers see a warning on the event dashboard asking them to add
  consent questions to health questions, and the instance administrator can list
  them. Nothing is changed automatically.
- Out of scope: health data registrants volunteer in general free-text fields
  (`additional_information`). Presets get a hint asking not to.

## 6. Access and leakage (Art. 5(1)(f), 32)

- **[implemented]** Registrations are guarded by `event.registrations.*`
  (`registration.module.ts`): directors and coordinators view/create/edit/delete,
  counselors view/create, viewers view. Organization admins hold no registration
  permissions (`ORGANIZATION_EVENT_PERMISSIONS`).
- **[implemented]** The SSE stream only pushes registration updates to holders of
  `event.registrations.view` (`common/src/realtime/events.ts`).
- **[implemented]** Audit logs record _which_ answer changed (`data.allergies`),
  never the value (`registration.audit.ts`).
- **[implemented]** Notice free text is sanitized on the way in
  (`sanitizeContent` / `sanitizeAddendum`) and again when rendered (DOMPurify).
- **[implemented]** Stored files are encrypted at rest when the storage is
  configured for it (`core/storage/encrypted.storage.ts`).
- **[gap]** Every role with `event.registrations.view` sees every answer, health
  data included. Message templates receive the full `registration.data`
  (`template.mail.ts`), change emails list changed answers by label
  (`registration.changes.ts`), and CSV export (`useCsvExport.ts`), table templates
  and the registration PDF show whatever the viewer can see.
- **[planned]** One permission, `event.registrations.health.view` (skill:
  `add-permission`), granted to directors and coordinators by default. Answers of
  tagged questions are removed for everyone without it in one place — the
  registration resource — so API, SSE, table templates, PDF and CSV export follow.
  Emails never include tagged answers: they are removed from the template context
  and from change emails. Justified by Art. 32 and data minimisation.

## 7. Platform-level processing

Processing by the platform operator itself, described in the platform privacy
policy rather than the organization's notice.

- **[implemented]** Captcha on public submissions is optional and pluggable; the
  provided driver is Cloudflare Turnstile (`core/captcha/turnstile.provider.ts`).
- **[implemented]** Error tracking (Sentry) is optional and configured to keep
  registrant data out: no request bodies, an allow-list of headers, no query data
  (`core/errorTracking/sentry.tracker.ts`).
- **[implemented]** Request logs store anonymized IP addresses (`core/anonymizeIp.ts`,
  used in `core/morgan.ts`).
- **[review]** Turnstile involves a transfer to a US provider. It is a platform
  processor, so the organization notice only names "the operator of this
  registration platform"; the platform policy must name it.

## 8. Retention and deletion (Art. 5(1)(e), 17)

- **[implemented]** The notice states a retention period (anchored at event end or
  submission) plus exceptions, which either run for their own period or until
  consent is withdrawn — the latter only for purposes resting on consent
  (`retention_exception_consent_basis` gap).
- **[implemented]** A daily job (`retention-reminder`, 06:30) emails an event's
  directors 14 days before the latest period promised to its registrants runs out,
  computed from the notice versions stamped on the registrations
  (`privacy-retention.service.ts`). Events without stamped registrations are skipped.
- **[review]** The job deliberately deletes nothing: what must be kept (an unpaid
  invoice, an insurance claim, a safeguarding matter) is the controller's judgment.
- **[implemented]** Managers delete registrations individually; files left without
  an owner are removed from storage by the file service.
- **[gap]** A consent-bound exception ("until consent is withdrawn") has no upper
  limit, so data a person never withdraws consent for is kept indefinitely.
  **[planned]** Consent-bound exceptions also state a maximum period; the completeness
  check requires it. The newsletter subscription is unaffected — it lives in
  `NewsletterSubscriber`, ended by unsubscribing.
- **[gap]** Health answers are usually only needed until the event ends, but can
  only be removed together with the whole registration. **[planned]** One manager
  action per event, "delete sensitive answers", that clears the answers of tagged
  questions in all its registrations (audit-logged). The existing retention reminder
  mentions it. No per-category retention settings, no automatic deletion.

## 9. Data-subject rights (Art. 15–21)

- **[implemented]** The notice lists the rights with their conditions and names the
  organization's contact address for exercising them.
- **[implemented]** Registrants can download a copy of their own submission right
  after submitting (`RegistrationCopyDownload.vue`).
- **[implemented]** Rights are exercised through the organizer; no self-service
  portal is planned.

## 10. Minors (Art. 8)

- **[implemented]** The camp preset asks for guardian confirmation when the
  participant is a minor (`confirmation_guardian`).
- **[gap]** Not enforced platform-wide; a custom form can collect a minor's data
  without it. No change planned beyond the preset.
- **[review]** Art. 8's age thresholds (16 in Germany, 15 in France) concern consent
  to information society services offered directly to a child. For camp health
  forms, consent by the guardian is assumed to be the safe default.

## 11. Newsletter

- **[implemented]** Subscribers added by hand need the manager to confirm consent
  (`consentConfirmed`, `newsletter-subscriber.validation.ts`).
- **[implemented]** Importing from an event takes only registrations with
  `newsletterConsent = true` (`importSubscribersFromEvent`). The earlier path that
  also imported registrations whose form never asked, on the manager's attestation
  alone, is removed. People who agreed elsewhere can still be added by hand with the
  existing confirmation. Justified by Art. 6(1)(a) and the ePrivacy rules on email
  marketing.

## 12. Requirements overview

| Obligation                             | Article           | How the app answers it                                   | Status                |
| -------------------------------------- | ----------------- | -------------------------------------------------------- | --------------------- |
| Inform before collection               | 13                | Notice builder, completeness gate, disclosure under form | implemented           |
| Notice matches the event's processing  | 13, 5(1)(a)       | Addendum overrides; exclusions with mandatory entries    | implemented / planned |
| Inform third persons named in a form   | 14                | —                                                        | review                |
| Prove what was shown                   | 5(2)              | Notice versions stamped; platform policy by timestamp    | implemented / review  |
| Intelligible, in the reader's language | 12                | Five locales; authored texts per locale                  | implemented / planned |
| Copy of transfer safeguards            | 13(1)(f)          | Fixed sentence pointing to the controller                | implemented           |
| Name the supervisory authority         | 13(2)(d)          | Derived from country; generic text where regional        | implemented           |
| Whether provision is required          | 13(2)(e)          | Contractual vs. statutory, per purpose; (g) to follow    | implemented / planned |
| Lawful basis per purpose               | 6                 | Catalogue, per-purpose basis, legitimate-interest text   | implemented           |
| Basis for special categories           | 9(2)              | Declared in notice, registration gate; (g) to be added   | implemented / planned |
| Explicit consent obtained              | 9(2)(a), 7        | Tagged consent questions, gate, submission check         | planned               |
| Proof of consent                       | 7(1)              | Form answer, `createdAt`, `consentTexts`, audit log      | planned               |
| Freely given                           | 7(4)              | Optional by default; mandatory option under review       | planned / review      |
| Withdrawal                             | 7(3)              | Manager action, audit-logged                             | planned / review      |
| Need-to-know access                    | 5(1)(f), 32       | Role permissions; health permission in one place         | implemented / planned |
| Storage limitation                     | 5(1)(e)           | Reminder, manual deletion, sensitive-answer deletion     | implemented / planned |
| Erasure                                | 17                | Manager deletion, orphan file cleanup                    | implemented           |
| Objection shown separately             | 21(4)             | List item plus note                                      | review                |
| Children                               | 8                 | Guardian confirmation in preset                          | implemented / review  |
| Newsletter consent                     | 6(1)(a), ePrivacy | Form column; import only with recorded consent           | implemented           |
| Processor agreement                    | 28                | Outside the app                                          | gap                   |
| DPIA                                   | 35                | Outside the app (organizer)                              | review                |

## 13. Open questions for legal review

1. Is consent withdrawal by email to the organizer, recorded by a manager,
   sufficient under Art. 7(3)?
2. May consent to health data be a condition of participation when the data is
   needed for the participant's safety (Art. 7(4))?
3. Which health fields of a French accueil collectif de mineurs rest on Art. 9(2)(g),
   under which provision — and does that hold for German participants and for a
   German organizer running a stay in France?
4. How far may one consent cover related categories (health, allergies, medication)
   under one purpose?
5. Is organizer-controlled tagging, with the platform enforcing only what is tagged,
   an adequate division of responsibility?
6. Does the platform privacy policy need the same version history as the
   organization notice?
7. Do emergency contacts need Art. 14 information, or does Art. 14(5) apply?
8. Is the right to object presented separately enough for Art. 21(4)?
9. Should church organizations' notices cite KDG / DSG-EKD and their authorities?
10. Does the platform need its own DPIA as processor, or is it the organizers' duty
    alone?

## 14. Implementation order

Legal risk first, small independent fixes before foundations, and everything that
reads tags after the tagging itself.

**Phase 0 — quick fixes, no dependencies** (done)

1. Free-text organization notice: the event addendum editor offers free text only,
   and the server refuses structured addendum entries in that mode (section 3,
   finding 1).
2. Newsletter import only takes registrations with `newsletterConsent = true`
   (section 11).
3. Notice wording: Art. 13(2)(e), generic text for regional supervisory authorities,
   how to obtain a copy of transfer safeguards (section 3, findings 2–4).

**Phase 1 — event exclusions, independent of tagging**

4. Event exclusions: the `excluded` addendum field, composition, publish
   normalization and refusal, `allEvents` on organization entries, the editor's
   three states (section 2). Builds on item 1 for the free-text rule; the form
   check arrives with item 7.

**Phase 2 — tagging, the foundation**

5. `privacyCategory`, `consent`, `consentFor` question properties and the shared
   coverage helper (`common/src/form/`).
6. Presets: tag their questions and add a health consent question. New events only.

**Phase 3 — enforcement and proof, shipped together**

7. Registration gate and submission check. Its release date is the legacy cutoff.
   Excluded categories count as undeclared.
8. `Registration.consentTexts`, the server-side copy, and the stale-text comparison.

**Phase 4 — access**

9. `event.registrations.health.view`, filtering in the registration resource, health
   answers kept out of emails. Most urgent in substance, but it only works on tagged
   forms.

**Phase 5 — lifecycle**

10. Manager action "withdraw consent".
11. Per-event "delete sensitive answers", linked from the retention reminder.
12. Maximum period for consent-bound retention exceptions. Tightens completeness:
    existing notices must add it on their next publish.

**Phase 6 — rollout and conveniences**

13. Warnings for legacy events still accepting registrations, and the
    administrator's list of them.
14. Keyword hint in the form editor's linter.
15. Translation completeness per locale. Tightens completeness like item 12; release
    both together with one announcement to organizers.

**Waiting for legal review:** Art. 9(2)(g) and its legal reference, the "necessary
for participation" option, self-service withdrawal, platform policy versioning,
Art. 14 for emergency contacts, church data protection law.
