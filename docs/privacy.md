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
- **[implemented]** An event can inherit, override or drop (exclude) an
  organization entry. See "Event exclusions" below.
- **[implemented]** Two modes (`PrivacyNoticeMode`):
  - `builder` — the organization ticks catalogue entries and the app renders the
    legal text in all five locales.
  - `free_text` — the organization writes the whole notice itself. No structural
    check, no automatic translation.
- **[implemented]** Controller identity comes from the `Organization` record, the
  supervisory authority from `Organization.country` (`supervisoryAuthorities.ts`).
  Data-subject rights, the complaint right and the data-provision statement are fixed
  text, not authored.
- **[implemented]** Recipients, like purposes and categories, take `custom:<id>`
  entries with an organizer-written label per locale (`PrivacyRecipientRef`):
  Art. 13(1)(e) asks for every recipient or category of recipients, and a closed
  list left an organizer whose recipient fits no key to leave it out or force it
  into a wrong one. Composition, exclusions, `allEvents` and transfers work by key;
  a custom recipient without a name is a completeness gap
  (`custom_recipient_label`). The organization editor adds them; events see them as
  inherited rows.
- **[implemented]** Catalogue additions for the frequent cases:
  `partner_organization` (co-organizer or partner abroad — its `country` drives
  the transfer disclosure), `participants` (lists shared with other participants,
  e.g. the carpool list), `it_service_provider` (the organizer's own processors:
  mail, cloud storage, accounting).
  - **[review]** Their wording in the five locales.

### Event exclusions

Art. 13 and Art. 5(1)(a) ask for the processing that actually happens. The
organization notice is the union of all its events, so an event inheriting it
whole over-declares. Each inherited entry gets three states — inherit, override,
exclude — inside the existing addendum. No per-event notice, no new table.

Code: `common/src/privacy/exclusions.ts` (`appliedExclusions`, `refusedExclusions`,
`normalizeExclusions`, `withoutRefused`), composition in `compose.ts`, publish and
clone rules in `PrivacyNoticeService`.

- **[implemented]** One optional addendum field, stored in the same versioned JSON:

  ```ts
  excluded?: {
    purposes?: PrivacyPurposeRef[]; // also retention exceptions with that scope
    dataCategories?: PrivacyDataCategoryRef[];
    recipients?: PrivacyRecipientKey[];
    transferCountries?: string[];
  } | null;
  ```

- **[implemented]** `composePrivacyNotice` removes excluded organization entries before
  merging the event's own, so the order is: organization → minus exclusions → plus
  event entries (an event entry with the same key is an override, as today).
- **[implemented]** Per part of the notice:

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

- **[implemented]** Retention exceptions share the purpose vocabulary (`scope`), so
  excluding a purpose also drops the exception scoped to it, and a `custom:` scope
  is excluded by its ref. No second list, and an excluded consent purpose never
  leaves a consent-bound exception behind (`retention_exception_consent_basis`).
  An event that drops a purpose but must keep its statutory exception restates the
  exception.
- **[implemented]** Transfers: `countries` is the organization's minus the excluded ones,
  plus the event's. A country stays whenever a composed recipient names it, so
  excluding a country can never hide a transfer that a listed recipient causes.
  `enabled` is false and the safeguard drops when no country remains.
- **[implemented]** Mandatory entries. The organization can mark a purpose, category or
  recipient "applies to every event" (`allEvents: true` on the entry, default
  false). Together with `ALWAYS_RECIPIENT_KEYS` these cannot be excluded.
- **[implemented]** Two layers, so a notice cannot become false by construction at any
  time:
  - composition _ignores_ an exclusion that may not apply (mandatory entry, always
    recipient, country in use), so an organization flagging an entry later reaches
    events that excluded it earlier;
  - publishing _refuses_ such an exclusion (422, like structured entries under a
    free-text notice), so the author is not misled.
- **[implemented]** On publish the server normalizes exclusions: it drops exclusions of
  keys the current organization notice does not declare, and of keys the event
  restates (restating wins). An entry the organization adds later is therefore
  inherited, never silently hidden — over-declaring is the safe failure.
- **[implemented]** Completeness stays one function. `addendumGaps` already checks the
  composed notice and reports only the gaps the event introduces, so excluding the
  last purpose, category or recipient blocks publishing with the existing gaps. No
  new gap codes.
- **[implemented]** Exclusions count as structured entries: under a free-text
  organization notice they are refused (`hasStructuredEntries`) and stripped when
  cloning (`publishableAddendum`).
- **[implemented]** Versioning needs no change: exclusions are part of the addendum
  content, so publishing appends a version, identical content is reused, and the
  stamp on the registration proves what was hidden. Versions without `excluded`
  compose as before. The retention reminder reads the composed notice and follows.
- **[implemented]** Cloning copies exclusions with the addendum; normalization against
  the target organization drops those it does not declare.
- Exclusions versus the form. **[implemented]** With questions tagged (section 5),
  an excluded category that the form collects is undeclared, so the registration
  gate refuses registrations — no separate check. **[implemented]** For untagged
  questions, the
  editor warns when an excluded category matches a form `eventDataType` suggestion.
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
- **[implemented]** The notice and the form are linked through the questions'
  privacy tags: a form asking for a tagged category the notice does not declare is
  refused at the registration gate. Untagged questions stay the organizer's
  responsibility. See section 5.

## 3. The notice builder

### Authoring

- **[implemented]** Organization wizard (`OrganizationPrivacyPage.vue`), six steps:
  controller (read from the organization record, plus the optional data
  protection officer — `PrivacyDpoFields.vue`), data, purposes, recipients,
  retention (also transfers and automated decisions — `PrivacyRetentionStep.vue`),
  additional text. The stepper marks the step a gap
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
- **[implemented]** Each inherited entry gets keep / change / exclude in the event
  editor (`InheritedEntryToggle.vue`), with exclusion unavailable for mandatory
  entries, always-recipients and countries in use; the caption says why. "Change"
  is offered where the event has a value of its own to set: the Art. 9 basis of a
  special category and a recipient's name. Purposes and transfer countries are
  keep / exclude only, and the organization's custom categories get rows too.
  Excluded entries stay visible, struck through, also under "hide inherited".
- **[implemented]** The organization wizard marks a purpose, category or recipient
  "applies to every event" (`allEvents`).
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
5. **[implemented] Translations are checked per locale.** A translated text in
   the notice needs every locale it is read in (Art. 12): the organization's notice
   every locale its events are offered in, an event's addendum the event's locales
   (`requiredLocales`, `PrivacyNoticeCompletenessOptions`). An untranslated text
   serves all locales; an organization without events accepts any. Copying an
   addendum to a new event stays lenient; the next publish checks it.
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
11. **Events over-declare.** Every event inherited all organization entries.
    **[implemented]** Event exclusions (section 2).

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

### Church data protection law (Art. 91)

Churches that had comprehensive data protection rules when the GDPR took effect may
keep applying them (Art. 91). In Germany that is the Catholic Church's **KDG**
(Gesetz über den Kirchlichen Datenschutz) and the Protestant Church's **DSG-EKD**.
Church bodies — parishes, dioceses, Landeskirchen, and often their charities —
are governed by them instead of the GDPR and the BDSG, and answer to a church
supervisory authority. Parish youth camps and confirmation retreats are a core use
of the platform, so today's notice is wrong for them in two places: it cites GDPR
articles, and it names the state authority.

- **[planned]** An organization setting, the data protection framework: `gdpr`
  (default), `kdg` or `dsg_ekd`, offered only where the organization's country has
  church frameworks (Germany). Declared by the organization, never inferred: only
  church bodies themselves fall under KDG or DSG-EKD, while independent associations
  with a Christian background (a CVJM e.V., most scout groups) stay under the GDPR,
  and neither the country nor the name tells them apart.
- **[planned]** Each framework is a data record, not a branch in the renderer:
  - a citation table from every GDPR provision the notice cites (Art. 6(1)(a)–(f),
    7(3), 9(2), 13–21, 77) to the framework's own paragraph;
  - how the supervisory authority is found: for KDG one of the regional Catholic
    data protection authorities, chosen by diocese; for DSG-EKD the EKD data
    protection commissioner and its regional office.
    The notice keeps its structure and reads only citations and authority from the
    record. The same mechanism covers other countries' church frameworks later (e.g.
    the Polish Catholic Church's general decree).
- **[planned]** The DPO step (step 1, `PrivacyDpoFields.vue`) explains the
  framework's own rule on when a DPO is required, instead of the BDSG one.
- **[planned]** The notice version records the framework it was published under, so
  the proof of information (section 2) stays exact if an organization changes it.
- **[gap]** Until then a church body can only use a free-text notice, and the
  structured parts outside it — the supervisory authority from
  `Organization.country` — still name the state authority. A per-organization
  override of the authority is the minimal stop-gap.
- **[review]** The citation tables and the authority list must come from legal
  review; no paragraph number is shipped unverified.

## 5. Consent (Art. 7, 9(2)(a))

### Today

- **[implemented]** Consent questions exist only as ordinary form questions. The
  camp preset carries `consent_rules`, `consent_general_terms_and_conditions`,
  `consent_forward_list_participants`, `consent_privacy` (photos), `newsletter` and
  `confirmation_guardian` (`backend/src/app/event/presets/camp/form.ts`).
- **[implemented]** Newsletter consent is the only consent mapped to a column:
  the consent with the purpose `newsletter` → `Registration.newsletterConsent`
  (see "Consent purposes" below).
- **[implemented]** The presets tag their questions and ask for consent before
  health data (Phase 2, below). Events created earlier keep their saved forms.
- **[implemented]** Consent is enforced for every event (Phase 3, below).
- **[implemented]** The wording of every tagged consent is stored with the
  registration (`Registration.consentTexts`). Untagged consent questions are not
  copied; the form editor autosaves, so their wording is not provable.

### Planned: consent questions and special categories

Applies to every form, not only the presets. Justified by Art. 9(1) (processing
without a basis is prohibited) and Art. 7(1) (the controller must be able to
demonstrate consent).

**Tagging — two question properties, both set by the organizer**

**[implemented]** `common/src/form/properties/privacy.ts` registers the properties;
`common/src/form/privacyTags.ts` reads them from the saved form JSON
(`extractPrivacyTags`) and answers the two coverage questions Phase 3 builds on:
which consent-based categories no consent question covers
(`uncoveredConsentCategories`), and which answers were given without their consent
(`unconsentedAnswers`). The form editor shows the tags in every mode, with the
catalogue's labels; "consent covers" appears once a question is marked as consent.
Tags sit on questions, including those inside dynamic panels; matrix columns cannot
be tagged, and only boolean questions can be consents.

- `privacyCategory` on a data question: the catalogue key it collects (`health`,
  `allergies`, …).
- `privacyConsent: true` on a consent question: its wording is copied into the
  registration (see "Proof"). Used by every consent — photos, carpool list,
  newsletter, health.
- `privacyConsentFor` on a consent question, optional: the special categories it
  unlocks. Only these feed the registration gate and the submission check.
- `privacyConsentPurpose` on a consent question: the catalogue purposes it is
  asked for (see "Consent purposes" below).
- The `privacy` prefix keeps the names out of SurveyJS's way: a native property of
  the same name would be removed when ours is registered. A test
  (`common/tests/unit/form/propertyNames.test.ts`) fails if SurveyJS ever defines
  one of the platform's property names.
- Not `eventDataType`: it holds one value and maps plain answers to registration
  columns. Consent is the privacy tags' alone, newsletter consent included (see
  "Consent purposes" below).
- `privacyConsent` and `privacyConsentFor` stay separate so a consent that is not
  about a special category (the carpool list shares contact data) does not gate
  every contact question.
- **[implemented]** The presets tag their own data and consent questions:
  - camp: `medical_restrictions` is always visible and optional; the consent
    `consent_health` (health, allergies) opens the consent page as a required
    yes/no. `food_intolerance` asks for preferences only and sends allergies to
    the medical question;
  - seminar: `dietary_requirements` asks for preferences only; a new optional
    `allergies` question, with the consent `consent_allergies` on the consent page;
  - every preset: photo consent tagged `privacyConsent`, and the camp's carpool-list and
    newsletter consents too. Terms and conditions are agreements, not consents, and
    stay untagged.
  - The nutrition fields (`food_intolerance`, `dietary_requirements`) are tagged
    too: an intolerance is health data, a religious diet (halal, kosher) a special
    category. The one consent covers health, allergies and diet, so it also
    appears when only a diet is entered — a little more than strictly needed, and
    simpler than telling preferences from health.

**Classification — organizer-controlled**

- A question property `privacyCategory` holds a catalogue key (`health`,
  `allergies`, …). The organizer sets it; it is the source of truth.
- **[dropped] Keyword hints** (suggesting a tag for questions that read like
  health data or a consent). Matching words cannot tell what a question collects:
  a free-text "anything we should know?" asks for health data without any keyword,
  so a quiet editor would read as "checked, nothing found". Tagging rests on the
  organizer; the `privacyCategory` help text says that only tagged questions are
  treated as sensitive and to check free-text fields too.
- **[review]** Tagging rests on the organizer, as controller. The platform enforces
  consequences of what is tagged; it does not try to discover what is not. An
  untagged consent question gets no wording copy.

**Consent wording — in the form**

- The organizer writes the consent question in the form editor and decides where
  it goes. Wording, placement and translations stay with the organizer.
- **[implemented]** While a tagged special category has no consent covering it,
  each question tagged with it offers "Add consent question" in its box on the
  form editor's design surface (a Creator message panel,
  `frontend/src/lib/surveyJs/privacyIssues.ts`). It appends a consent for that
  one category at the end (`consentQuestionJson`), never for every uncovered
  one: unrelated purposes stay separate, and an organizer may widen it to
  related categories (`privacyConsentFor`). It is worded in all five locales
  (what, for which purpose, who receives it, voluntary, how to withdraw) and
  asked like the presets: shown once a covered question is answered,
  then required. A covered question inside a dynamic panel cannot be seen by a
  form-level condition, so the consent is then shown always and left optional.
  - **[review]** The generic wording names the event team as recipient and care
    during the event as purpose; an organizer whose purpose differs must edit it.

**Scope of one consent**

- One consent may cover closely related categories serving one purpose — e.g.
  health, allergies and medication for medical care during the event.
- Unrelated purposes stay separate: photo publication, the carpool list and the
  newsletter each keep their own question, and no consent is merged with the terms
  and conditions (Art. 7(2)).
- **[review]** Where exactly "closely related" ends is a legal judgment; the default
  texts follow one-purpose-per-consent.

**Consent purposes — one source of truth** **[implemented]**

A newsletter consent used to need two properties that had to agree:
`eventDataType: 'newsletter_consent'` filled the column the import reads, and
`privacyConsent` kept the wording as proof. One without the other imported
subscribers whose consent could not be shown (Art. 7(1)). The purpose makes that
state impossible to express, instead of validating it in the editor or refusing
registrations over a configuration mistake.

- `privacyConsentPurpose` (multiple values, `PRIVACY_PURPOSE_KEYS`) names what a
  consent is asked for: `newsletter`, `photo_publication`, `transport`,
  `medical_care`, `catering`, … More than one only for closely related purposes
  (see "Scope of one consent"): the camp's health consent is `medical_care` and
  `catering`.
- Purpose and `privacyConsentFor` answer different questions. The purpose says
  why consent is asked; `privacyConsentFor` says which special-category answers it
  unlocks. A newsletter consent unlocks no data; what a purpose collects is up to
  each organization's notice, so one cannot be derived from the other.
- Form editor: "Purpose" appears once a question is marked as consent. "Unlocks
  sensitive data" appears only while the form tags a special category, offering
  just the categories it tags — newsletter, photo and carpool consents never show
  it.
- `eventDataType: 'newsletter_consent'` is removed. A consent whose purposes
  include `newsletter` is the newsletter consent; a purpose on a question without
  `privacyConsent` has no effect.
- `Registration.newsletterConsent` stays, with the same meaning: `true` agreed,
  `false` declined, `null` never asked. Any yes counts when the question repeats
  in a dynamic panel — the newsletter goes to the registration's address, not to
  each entry.
- It is derived next to the consent wording (`RegistrationForm.consentColumns`),
  not in `computedRegistrationData`, which maps `eventDataType` answers only.
  `registrationColumns` combines both for every write and the seeder, so no write
  path can skip it.
- The data migration `20261120120000_newsletter_consent_purpose` rewrites saved
  forms: a boolean tagged `newsletter_consent` becomes `privacyConsent: true` with
  `privacyConsentPurpose: ['newsletter']`. Stored registrations need no change;
  recomputing gives the same value.
- Every preset consent names its purpose, and "Add consent question" tags its
  generic wording `medical_care`.
- **[review]** Only catalogue purposes can be chosen; an organization's custom
  purposes cannot be named on a consent yet.

**Proof (Art. 7(1))**

| What must be shown       | Where it comes from                                                   |
| ------------------------ | --------------------------------------------------------------------- |
| The affirmative choice   | The consent answer `true` in `Registration.data`                      |
| When                     | `Registration.createdAt` for consent given at submission              |
| The exact wording        | `Registration.consentTexts`, in the language of `Registration.locale` |
| Who consented            | The registrant, or the guardian via `confirmation_guardian` answers   |
| Changes after submission | The audit log (`registration.audit.ts`) — who, when, which field      |

- **[implemented]** One nullable JSON column, `Registration.consentTexts`, keyed by
  where the answer lives: `{ "consent_privacy": "I agree that photographs of …" }`,
  `kids[0].consent_health` inside a dynamic panel
  (migration `20261118120000_add_registration_consent_texts`). Existing
  registrations stay `null`, like the notice stamp. Managers see it in the
  registration resource.
- **[implemented] The server copies the text**, never the client.
  `RegistrationForm.givenConsentTexts` (`registration.form.ts`) reads each tagged
  consent's title and description in the registration's locale with placeholders
  filled in (`{first_name}`), through the shared `consentTexts`
  (`common/src/form/privacyTags.ts`). The description is included because it
  often carries the legally relevant part ("voluntary, can be revoked at any time").
- **[implemented]** Copied at submission only, the one moment the form witnesses
  the consent. Manager edits never touch it: a consent given or withdrawn later
  (on paper, by email) is proven by that record, and the audit log shows the
  change. A withdrawal leaves the stored text in place, as what was consented to.

**Stale forms — compare the consent texts, like the price**

The form may change between opening and submitting: the editor autosaves, and live
forms get edited while registration is open. Copying the server's current text would
then record wording the registrant never saw.

- **[implemented]** On submit, the client sends the texts of the tagged consent
  questions it displayed (`displayedConsents`), next to the displayed total it
  already sends for `assertPriceUnchanged`.
- **[implemented]** The server renders the same questions from the current form and
  compares the consents given (`assertConsentTextsUnchanged`,
  `registration.privacy.ts`):
  - equal — the server's text is stored;
  - different — refused with a conflict (`REGISTRATION_CONSENT_CHANGED`); the form
    shows a `consentChanged` state asking to reload the page and register again,
    exactly like `priceChanged`. The answers are not kept across the reload — the
    simpler of the two, and the same as a price change.
- Only consent texts are compared, not the whole form: unrelated edits do not
  interrupt anyone filling in a form. No form versioning, no hash — the texts are
  short.
- Compared as processed text (placeholders filled, before Markdown): the client adds
  a Markdown renderer the server does not have (`addMarkdownRenderer`), so rendered
  HTML may differ for identical text.
- The placeholders must therefore render alike in every browser and on the
  server (`setVariables`): dates and times are formatted from the naive digits in
  UTC, so no runtime zone moves them, and every formatted value has one kind of
  space only (`uniformSpaces`) — engines' locale data differ mostly in that.
- A link inside a consent text (`{_file.rules}`) is written by one resolver on both
  sides (`addEventFileSlotResolver`): the root-relative route of the slot
  (`fileSlotPath`), nothing fetched. It is compared, and stored, as that link.
- **[review]** The link names the slot, not the document behind it. Replacing the
  linked file is not detected.
- **[review]** Audit entries are purged after two years (`AUDIT_RETENTION_DAYS`).
  Proof of a later change must not be needed longer than that, or the registration
  is deleted earlier anyway.

**Placement and answer — asked at the end, only when health data was entered**

Organizers and registrants are not privacy lawyers; hiding questions behind a
consent confused both. So the data questions stay visible and optional, and one
consent is asked once, after them, only if it is needed.

- **[implemented]** Health questions are ordinary optional questions. The consent
  covering them sits on the consent page and appears once any of them has an
  answer (`visibleIf: '{medical_restrictions} notempty or {food_intolerance}
notempty'`). "No known allergies" is
  an answer too, so it asks for consent as well.
- **[implemented]** Once shown, it must be agreed to (`requireTrue`), by ticking it
  — never preselected. `requireTrue` alone enforces it once shown; `isRequired`
  would only add the asterisk and SurveyJS's generic message, so the presets
  leave it out, like their other consents. Without health data the registration
  goes through without it. Not wanting to consent means leaving the health fields empty; the consent
  text and its error message say so. The registrant's choice stays free (Art. 7(4)):
  share health data with consent, or share none.
- **[implemented]** Before processing: nothing is processed before submitting, and
  the form saves no drafts, so a consent asked last still comes first.
- **[implemented]** One consent per purpose: health, allergies and medication for
  care during the event share one question; the wording names the purpose, the
  recipients (event team, medical staff or caterer) and how to withdraw.
- **[implemented]** Safety nets, for organizer-built forms that do not follow the
  preset. Answers whose consent was not given are never dropped silently: the form
  stops before submitting and marks those questions, asking to agree or remove the
  answer (`unconsentedQuestions`) — this catches a consent question the form hides.
  The server's submission check refuses such answers
  (`REGISTRATION_CONSENT_MISSING`); the form explains that state and offers to edit
  the answers. Manager edits are not checked: what a manager records (allergies a
  parent phoned in) may rest on consent given outside the form, which is the
  organizer's responsibility, and the audit log records the edit — checking them
  would also make older registrations uneditable once questions are tagged. While the form asks for a category no consent covers, every
  registration is refused, the managers' included (`eventPrivacyCompliant`), and the managers see
  why on the event dashboard (`PrivacyComplianceNotice`).
- No table flag for a missing health consent: health data without consent cannot
  be stored (the form demands the consent, the server refuses answers without it),
  so `consent_health != true` would only mean "nothing entered" — which the empty
  health columns already show — and would read like a refusal.
- **Necessary for participation:** an organizer who genuinely needs the
  information — a youth camp — marks the health question required. The consent then
  always appears and must be given, with no extra setting: the preset's rule already
  follows the answers. Whether that may be made a condition is still open
  question 2.
- **[implemented]** "Add consent question" in the form editor — see "Consent
  wording".

**Mandatory consent (Art. 7(4))**

- Not by default: optional data, consent only with data.
- **[review]** Whether consent may be a condition of participation when the data is
  needed for the person's safety (e.g. allergies at a catered camp) is open
  question 2. The mechanism exists — a required health question — but the presets
  do not use it; it is the organizer's judgment until confirmed.

**Enforcement**

The form editor autosaves; an incomplete form is a normal state mid-edit, so saving
is never refused. Enforcement sits at the outward-facing action, like organization
verification:

- **[implemented] Registration gate.** An event refuses public registrations while
  a tagged category relying on consent has no consent question covering it, or a
  tagged category is not declared in the composed notice
  (`formPrivacyIssues`, `common/src/form/privacyCompliance.ts`). Guard
  `eventPrivacyCompliant` (`event.guard.ts`), composed around the
  `registrationOpen` / `eventOrganizationVerified` chain rather than inside it:
  managers with `event.registrations.create` bypass the open/close dates, not
  this — who enters the data does not change what the notice covers. The public
  page hides their "open form anyway" override while it applies.
- **[implemented]** The public event page runs the same check and shows a
  `privacy` state ("registration is not possible at the moment") instead of a form
  that would fail. In the form editor, each question causing it says so in its
  own box (`onCreateCustomMessagePanel`), refreshed on every save: undeclared
  data links to the privacy settings, uncovered data offers "Add consent
  question". The event dashboard states it for the event as a whole.
  **[implemented]** A notice on the event dashboard while registration is open or
  scheduled (`PrivacyComplianceNotice`).
- Which categories rely on consent: every special category, except those the notice
  declares on another Art. 9 basis (`consentBasedCategories`). Under a free-text
  notice nothing is readable, so all special categories rely on consent and the
  "undeclared" check is skipped.
- **[implemented] Submission.** Refuse (422,
  `REGISTRATION_CONSENT_MISSING`) when a tagged question relying on consent has an
  answer while its consent is not `true` (`assertConsentsGiven`), whoever submits
  — a manager creating a registration included. Read through the
  survey model (`unconsentedQuestions`), like the client's clearing and the mail
  filter, so SurveyJS decides where an answer lives. A consent counts for the
  answers in its own dynamic panel entry, an enclosing one or at the top level;
  one asked in other entries only when given in all of them. The client checks
  against the same `consentBasedCategories`, once the notice is loaded. Tags alone are read off the
  form JSON (`extractPrivacyTags`): they are the platform's own properties.
- Categories relying on (g) or another non-consent basis need no consent question.
- **[implemented] Manager edits are not checked.** A manager may record a
  sensitive answer without the form's consent, e.g. allergies a parent phoned in
  with consent given outside the form; that is the organizer's responsibility.
  The stored consent wording (`consentTexts`) is not updated by an edit: it is
  proof of what the form showed at submission only. The editor's form skips the
  client check for the same reason.
- **[review]** Editing a live form into a non-compliant state stops registrations
  until it is fixed. Intended: collecting without a basis is not allowed even
  briefly.

**Withdrawal (Art. 7(3)) — by editing the registration**

- The registrant withdraws by contacting the organizer; the consent text and the
  notice say how.
- **[implemented]** No dedicated action: a manager edits the registration and
  empties the covered answers; emptying them hides the consent question again.
  Edits are not consent-checked (see above), so the manager is responsible for
  emptying them. The audit log records who edited it and when.
- Handled without undue delay; the event's managers are responsible.
- **[review]** Art. 7(3) requires withdrawing to be as easy as giving consent.
  Consent is a click; withdrawal is an email followed by a manager's action. Whether
  that is sufficient is uncertain. A self-service withdrawal is not planned until
  this is answered.

**Scope and legacy events**

- **[implemented]** Enforcement applies to every event, with no cutoff date. Every
  rule reacts to privacy tags only, and forms saved before tags existed carry
  none, so existing events are unaffected until a manager tags their questions —
  which is when the rules should apply. (An earlier `PRIVACY_ENFORCED_SINCE`
  cutoff was dropped for this reason.)
- Existing events are neither migrated nor warned about as such. **[implemented]**
  The dashboard notice above covers every event whose registration is open or
  scheduled while the gate refuses it.
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
- **[implemented]** Need-to-know is decided per role, not per answer. Every role
  with `event.registrations.view` sees every answer, health data included, because
  every one of them needs it:

  | Role          | Registrations | Why                                                               |
  | ------------- | ------------- | ----------------------------------------------------------------- |
  | `DIRECTOR`    | full          | Runs the event, answers for it                                    |
  | `COORDINATOR` | full          | Organizes participants, rooms and program                         |
  | `COUNSELOR`   | full          | Supervises participants; needs allergies and medical restrictions |
  | `VIEWER`      | full          | Helpers such as kitchen staff; organizers grant it knowing this   |
  | `TREASURER`   | none          | Finances only (`docs/finances.md`); see "Treasurer" below         |

  Filtering health answers inside a role (an `event.registrations.health.view`
  permission) was considered and dropped: almost every holder would need it, and
  filtering every place that shows registration data costs far more than it
  protects. Organizers who want a helper to see less give them no role.

- **[implemented]** Emails leave the platform's access control — they are
  forwarded and kept in inboxes — so they never include answers of questions
  tagged with a special category. Justified by Art. 32.
  - **Rendering time, not request time.** The job keeps carrying a snapshot of the
    registration, so the mail shows what the sender saw, even if the registration
    is edited or deleted before it goes out. `RegistrationTemplateMessage.answers()`
    loads the snapshot into `RegistrationForm` and calls
    `withoutSensitiveAnswers()` (`clearSpecialCategoryAnswers`, SurveyJS's
    `clearValue()` on every tagged question); the template gets the result as
    `registration.data`. SurveyJS decides where a value lives ("Other" text,
    comments, dynamic panels, `valueName`, future question types) — the platform
    has no storage rules of its own. A form that can't be read yields no answers,
    never all of them.
  - **Cost.** About 20 ms per mail (camp preset, measured), in the worker, one job
    at a time; Node serves other requests between jobs. Filtering every
    registration up front at request time was rejected: 20 s of blocked event loop
    per 1,000 recipients.
  - **Preview.** `message.controller.ts` renders through the same `context()`, so
    the preview shows exactly what is sent, filtering included. The editor's token
    picker leaves tagged questions out (`extractFormFields(…,
{ withoutSpecialCategories })`), since they would render empty.
  - **Change emails.** A changed tagged answer keeps its label and is worded
    "changed" (`isSensitive` on `RegistrationChange`); its value is dropped when
    the change list is computed, so it never enters the mail job either.
  - **Limits.** A sensitive answer copied into an untagged question
    (`setValueExpression`, `copyvalue`/`setvalue` triggers) is not caught — the
    organizer's tagging responsibility (open question 5). Answers to questions
    since deleted from the form stay in `data` and are printable by name; SurveyJS
    knows no question for them, and dropping unknown keys would need storage rules
    of the platform's own.
- **[implemented]** Queued mail jobs carry the full registration snapshot, so they
  must not outlive the mail. Each queue has a `retention: { completed, failed }`
  (`QueueOptions`, default 30 and 90 days) and prunes its own jobs
  (`Queue.prune()`): the database and memory queues delete rows, the Redis queue
  maps it to BullMQ's `removeOnComplete`/`removeOnFail` (`age`) — before, BullMQ
  kept finished jobs forever — and sweeps with `clean()`. `QueueService` only
  delegates to `QueueManager.prune()`; the daily `queue-job-cleanup` (04:45) is
  enough for retentions measured in days, and one measured in hours would need it
  to run more often. With the database driver it also prunes finished jobs under
  queue names nothing registers any more (renamed or removed queues), by the
  default retention.
- **[implemented]** The mail queue deletes a job as soon as it completes —
  `MessageDelivery` already records the send — and keeps failed jobs 14 days for
  retries. Failed jobs are not searched out when a registration is deleted (JSON
  payloads in two drivers); the 14 days are the accepted remainder. Rows of a
  queue that no longer exists are not pruned; renaming a queue must clean them.

### Treasurer and payments

- **[implemented]** `TREASURER` holds no registration permission. Nothing in
  finances, expenses or payouts reads registration data.
- **[planned, with `feat/payments`]** To match payments to registrations, the
  treasurer gets a fixed, read-only projection of each registration — never
  `data`, never files:

  | Field                              | Why                                                               |
  | ---------------------------------- | ----------------------------------------------------------------- |
  | id, payment reference              | The key a bank transfer is matched by                             |
  | first and last name                | Recognizing the registration                                      |
  | payer name                         | A guardian usually pays for a minor, under their own name         |
  | contact email                      | Payment reminders and refunds                                     |
  | address                            | Only once invoices are generated (invoice recipient)              |
  | status, created at                 | Cancelled or waitlisted registrations owe nothing or get a refund |
  | `quotedAmount`, currency, payments | What is due, what was paid, the balance                           |

  Amounts are already stored on the registration (`quotedAmount`), so no form
  answer is needed. Date of birth, gender, group, room and every answer stay out.

- **[planned]** It is a separate endpoint and resource with its own permission
  (skill: `add-permission`), not a filter on the registration resource:
  - an allowlist of fields cannot leak a question added later; a filter on
    `RegistrationResource` is a denylist every consumer must respect (SSE, table
    templates, PDF, CSV export, messages);
  - the treasurer works on payments, so it lives with the payments ledger: the
    payment list joined with the registration fields above;
  - the registration resource and its frontend stay free of partial objects.

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

Deletion is manual. The platform reminds, shows and records; what has to be kept
beyond a deadline is the organizer's decision, and keeping copies of records it
must retain (invoices, records for a funding body) is the organizer's job. Nothing
is deleted automatically, and an overdue deadline never counts as permission to
keep data.

### Periods in the notice

- **[implemented]** Every period counts from the end of the event: the data is
  needed until the event is over, and a period counted from each registration
  could fall due before the event even takes place. Counting from submission was
  dropped (no published notice used it); older versions still store an `anchor`,
  which is ignored, and publishing strips it.
- **[implemented]** The notice states a retention period plus exceptions, which either run for their own period or until
  consent is withdrawn — the latter only for purposes resting on consent
  (`retention_exception_consent_basis` gap).
- **[implemented]** Consent-bound exceptions also state a maximum period (`months`),
  required by the completeness check (`retention_exception`). The
  newsletter subscription is unaffected — it lives in `NewsletterSubscriber`, ended
  by unsubscribing.
- **[implemented]** `retention.specialCategories: { weeks }` is how long
  sensitive answers are kept, stated to registrants only when the notice lists a
  special category. Required on every builder notice
  (`special_category_retention`), not only on one declaring a special category:
  events may add one but have no retention editor, so they inherit the period. At
  most `maxSpecialCategoryWeeks` (4 weeks per month of the main period).

### Two kinds of data, two deadlines [implemented]

| Kind            | What                                      | Deadline from                 |
| --------------- | ----------------------------------------- | ----------------------------- |
| `sensitive`     | answers to special-category questions     | `retention.specialCategories` |
| `registrations` | all registration data, sensitive included | the notice's retention period |

- Sensitive data is a subset of the registration data. Its deadline is capped at
  the general one whenever it is computed, also when either is postponed, so it
  always stays the earlier.
- Deadlines are calendar dates (`YYYY-MM-DD`) in the event's time zone, counted
  from the day the event ends. They are
  computed whenever needed and never stored: nothing has to be kept in sync with
  the notices, and nothing has to compare a stored date with a recomputed one.
- They come from the notice versions stamped on the registrations, not from
  today's notice: a period is a promise made to a person at a particular moment.
  The earliest promise per kind wins (`retention.deadlines.ts`): deleting early is
  allowed, keeping data longer than promised is not. A form without
  special-category questions has no sensitive deadline; notices from before the
  sensitive period put sensitive answers under the main period. Free-text notices
  promise no date (composition drops their retention). Events whose registrations
  all predate the stamps (before August 2026) have no deadline: by design, the
  least complicated answer — they are deleted by hand on the data page.
- `EventRetentionState` holds only what cannot be computed, one row per event and
  kind once there is any: a postponement (`postponedUntil`, `postponeReason`, who
  and when) and the last reminder sent (`remindedFor`, the date it was for, and
  `remindedStage`). A deadline that moves no longer matches `remindedFor`, so its
  reminders start over without any reset.
- The daily `retention-reminder` job (06:30) walks every event not deleted that
  has stamped registrations, in batches, and computes its deadlines.
- **[implemented]** Deploying onto existing data needs no backfill: reminders go
  out at most a week after a deadline (`RETENTION_REMINDER_GRACE_DAYS`), so older
  deadlines only show as overdue and nothing is mailed about long-past events.

### Deletion [implemented]

- "Delete sensitive data" clears the answers of special-category questions in all
  registrations, model-based (`clearSpecialCategoryAnswers`, as for the email
  filter), and detaches files uploaded to them; the file cleanup removes those.
  Consent answers stay as proof of what was agreed. It reads the current form's
  tags: answers to a question removed or untagged since are no longer treated as
  sensitive and fall under the general deadline, which "Delete all
  registrations" covers. Tracking every key ever tagged was rejected: a second
  source of truth beside the form, and storage rules of our own for comments
  and nested panels.
- "Delete all registrations" deletes every registration. Bed assignments, files and
  audit entries are only detached (`SetNull`); a registration's mail delivery log
  and chore assignments go with it. Nothing financial references a registration;
  payments (`feat/payments`) must keep that so — their own payer details, no
  cascade.
- Both need `event.registrations.delete`, warn to keep a copy of anything legally
  required first, and require typing the event name (`SafeDeleteDialog`); the
  request carries `confirm: true`. Both can be run again safely; a rerun audits
  only what it changed.
- Deleting all registrations is one transaction: recorded, deleted and audited
  together or not at all. It gets 60 s instead of Prisma's 5 s, as detaching
  the files, beds and audit entries of a large event takes longer. A registration create re-reads the deletion state
  inside its own (serializable) transaction, so the two never interleave.
- The sensitive deletion is recorded first, on its own, which closes
  registration, then clears the registrations one at a time, each locked while
  it is read and written, so an edit saved meanwhile is neither overwritten nor
  lost. An edit carrying sensitive answers is written only on the condition that
  the event is not purged, so one racing a deletion is refused (409). Only when
  every registration is cleared is it done (`sensitiveDataClearedAt`): an
  interrupted run keeps its deadline and reminders, and the page offers it
  again, which finishes the job. Once done, a rerun still clears answers to a
  question tagged since; the first completion stays the deletion's date, and
  only a run that cleared something is audited.
- The event records the deletion for good: `sensitiveDataPurgedAt` (begun,
  which blocks sensitive edits), `registrationDataPurgedAt`; deleting everything
  sets both. Nothing clears them,
  and deleted data is never treated as restorable. A kind whose data is deleted
  has no deadline any more: no reminders, and it leaves the overviews.
- Deleting needs the event ended (`endAt` passed) and the registration closed
  (`eventRegistrationStatus`; an event without a window is closed once it has
  started), both checked under the event's row lock (409 otherwise; the data page
  disables both actions and says why). Before the end the team may still need the
  data, health details above all, and a slip on the day before a camp cannot be
  undone. Nothing requires deleting earlier: a person's erasure request deletes
  that one registration, and a cancelled or mistaken event is removed by
  deleting the event, both at any time. From
  then on it stays closed: an event edit that would reopen it — the window, or
  without one the start — is refused under the same lock (409; the editor and the
  event card disable the window), so the status needs no deletion check of its
  own. Nobody registers again, managers included (`eventNotPurged`, re-checked
  inside the create's transaction): a new registration would bring back what was
  deleted. After the sensitive deletion an edit carrying
  sensitive answers is refused (400), never
  silently stripped: the manager learns the input was not kept. After deleting everything, the dashboard hides the
  cards built on registrations and the participants page says the data is gone.
- **[implemented]** What was deleted is shown as deleted, never as empty. The
  texts give the reason ("for data protection reasons"), not the date; the data
  page and the audit log keep that.
  - After the sensitive deletion, table columns on special-category answers
    (`usePurgedFields`, from the current form's tags as the server checks edits)
    are hatched on screen and their cells show a dashed, italic "Deleted" chip
    (`PurgedTableCell`, whatever the column's `renderAs`); they are neither
    sortable nor searchable, print as "— deleted —" and export as "Deleted".
    The edit and view forms lock those questions and say why.
  - After deleting everything, participants, contact and the room and chore
    planners show `RegistrationDataPurgedState`, the program planner drops
    birthdays, the dashboard shows a banner and no shortcuts, and the event card
    shows "Data deleted" instead of the registration status and capacity.
- One audit entry per action (`retention` entity: `sensitive_purged`,
  `registrations_purged` with the count; `postponed` with the date). No personal
  data and no reason text. The existing two-year audit retention applies.

### Postponement [implemented]

- A manager with `event.registrations.delete` postpones either deadline
  immediately, without approval: a reason and a new date after both today and
  the current deadline, at most 12 months ahead (`MAX_RETENTION_POSTPONE_MONTHS`),
  and for sensitive data not past the general deadline. The server sends that
  range with each deadline (`postponeRange`), so the dialog does no date
  arithmetic of its own; it offers 1, 3, 6 and 12 months from the current
  deadline where they fit. A postponement only ever moves a date later: one the
  promise has since reached changes nothing. Postponing again is the renewal.
  The reminders start over for the new date.
- The reason may name a person or a case, so only managers with
  `event.registrations.delete` see it; overviews and the audit log leave it out.

### Reminders and visibility [implemented]

- 30 days before the effective date (the postponement's, else the due date) and
  on it, the managers holding `event.registrations.delete` get a mail
  (`EventRetentionDeadlineMessage`), naming the days actually left. Each stage is
  sent once per date, claimed before it is queued, and a missed run sends the
  most urgent stage reached, up to a week after the deadline.
- Settings › "Data & deletion" (`DataSettingsPage`) holds everything
  irreversible: the periods the current notice states (`periods`, with a link to
  the organization's privacy settings, where they are set), both deletion actions
  — available before or after the deadline, once the event has ended and
  registration has closed — with their deadline, the server's
  estimate from the current notice where there is none yet, or postponement, and deleting the event itself (moved here from the event card's
  menu). Shown to managers with `event.registrations.delete` or `event.delete`.
- Event dashboard (wrap-up phase): a summary of both deadlines and their status,
  linking to that page; no actions.
- Organization dashboard: deadlines due within 30 days or overdue — event, kind, date, status. No personal data, no reasons, no actions.
  Organization admins gain no registration access.

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
- **[implemented]** `newsletterConsent` comes from the consent whose purposes include
  `newsletter`, so every imported subscriber has its consent wording stored
  (section 5, "Consent purposes").

## 12. Requirements overview

| Obligation                             | Article           | How the app answers it                                   | Status                |
| -------------------------------------- | ----------------- | -------------------------------------------------------- | --------------------- |
| Inform before collection               | 13                | Notice builder, completeness gate, disclosure under form | implemented           |
| Notice matches the event's processing  | 13, 5(1)(a)       | Addendum overrides; exclusions with mandatory entries    | implemented           |
| Inform third persons named in a form   | 14                | —                                                        | review                |
| Prove what was shown                   | 5(2)              | Notice versions stamped; platform policy by timestamp    | implemented / review  |
| Intelligible, in the reader's language | 12                | Five locales; authored texts per locale                  | implemented / planned |
| Copy of transfer safeguards            | 13(1)(f)          | Fixed sentence pointing to the controller                | implemented           |
| Name the supervisory authority         | 13(2)(d)          | Derived from country; generic text where regional        | implemented           |
| Whether provision is required          | 13(2)(e)          | Contractual vs. statutory, per purpose; (g) to follow    | implemented / planned |
| Lawful basis per purpose               | 6                 | Catalogue, per-purpose basis, legitimate-interest text   | implemented           |
| Basis for special categories           | 9(2)              | Declared in notice, registration gate; (g) to be added   | implemented / planned |
| Explicit consent obtained              | 9(2)(a), 7        | Tagged consent questions, gate, submission check         | implemented           |
| Proof of consent                       | 7(1)              | Form answer, `createdAt`, `consentTexts`, audit log      | implemented           |
| Freely given                           | 7(4)              | Optional by default; mandatory option under review       | planned / review      |
| Withdrawal                             | 7(3)              | Registration edit, consent check, audit log              | implemented / review  |
| Need-to-know access                    | 5(1)(f), 32       | Role permissions; no health in emails; treasurer subset  | implemented / planned |
| Storage limitation                     | 5(1)(e)           | Deadlines, reminders, two manual deletion actions        | implemented           |
| Erasure                                | 17                | Manager deletion, orphan file cleanup                    | implemented           |
| Objection shown separately             | 21(4)             | List item plus note                                      | review                |
| Children                               | 8                 | Guardian confirmation in preset                          | implemented / review  |
| Newsletter consent                     | 6(1)(a), ePrivacy | Consent purpose; import only with recorded consent       | implemented           |
| Processor agreement                    | 28                | Outside the app                                          | gap                   |
| DPIA                                   | 35                | Outside the app (organizer)                              | review                |

## 13. Open questions for legal review

1. Is consent withdrawal by email to the organizer, carried out by a manager
   editing the registration, sufficient under Art. 7(3)?
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
9. Church frameworks (section 4, "Church data protection law"): the KDG and DSG-EKD
   paragraph for each GDPR provision the notice cites, the competent church
   authority per diocese / Landeskirche, and whether a church body's own
   charities (Caritas, Diakonie) always fall under the church framework.
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

**Phase 1 — event exclusions, independent of tagging** (done)

4. Event exclusions: the `excluded` addendum field, composition, publish
   normalization and refusal, `allEvents` on organization entries, the editor's
   three states (section 2). Builds on item 1 for the free-text rule; the form
   check arrives with item 7.

**Phase 2 — tagging, the foundation** (done)

5. `privacyCategory`, `privacyConsent`, `privacyConsentFor` question properties and the shared
   coverage helper (`common/src/form/`).
6. Presets: tag their questions and add a health consent question. New events only.

**Phase 3 — enforcement and proof, shipped together** (done)

7. Registration gate and submission check, for every event (the release-date
   cutoff was dropped later). Excluded categories count as undeclared.
8. `Registration.consentTexts`, the server-side copy, and the stale-text comparison.

**Phase 4 — access**

9. Emails and the mail queue (section 6), in this order:
   - Queue retention per queue; the mail queue drops completed jobs at once and
     failed ones after 14 days. Independent of tagging, covers every mail ever
     queued — ships first. (done)
   - Privacy properties renamed `privacyConsent`/`privacyConsentFor`, plus the
     SurveyJS name-clash test. (done)
   - Tagged answers cleared through the SurveyJS model when a mail is rendered
     (worker and preview), values of tagged changes redacted, tagged questions out
     of the token picker. Only works on tagged forms. (done)
   - The treasurer's payment projection (section 6) ships with `feat/payments`,
     not here.

**Phase 4b — consent flow for organizers and registrants** (done)

10. Health questions always visible and optional; the consent asked last, only
    once health data was entered, and then required. The submission check reads
    answers through the survey model (`unconsentedQuestions`); the JSON walk only
    reads tags.

**Phase 4c — privacy UI review** (done)

11. The organization and event privacy pages:
    - one row layout for every entry (`PrivacyEntryRow`): selection, label and
      chips, controls in a fixed right column, details indented below;
    - the organization wizard asks purposes before data, since a purpose
      pre-selects its data and recipients; data categories are grouped into
      general and special (Art. 9); "applies to every event" is a lock toggle
      (`AllEventsToggle`) instead of a sentence-long checkbox per entry;
    - the event page drops its duplicate list of the organization's entries,
      shows inherited entries inline, and can add purposes of its own;
    - the event page is one card per topic (`PrivacySection`) with a one-line
      summary ("2 from your organisation · 1 of this event"); a card lists what
      applies and keeps the rest of the catalogue behind "Add more";
    - the event page proposes the categories the form's `privacyCategory` tags
      ask for, and says when an undeclared one blocks registrations;
    - both pages say when the viewer can read but not edit.

    Custom recipients and the new recipient keys (section 2), and "Add consent
    question" in the form editor (section 5).

**Phase 5 — retention workflow** (section 8, done)

12. Notice: `retention.specialCategories` with its completeness check, and the
    maximum period for consent-bound exceptions. Both tighten completeness:
    existing notices add them on their next publish.
13. Deadlines computed from the stamped notices, `EventRetentionState` for
    postponements and reminders, and the daily job (30 days before, and on the
    date), replacing the single reminder.
14. "Delete sensitive data" and "Delete all registrations", the purge timestamps
    and the permanent registration stop.
15. Postponement with a reason and the 12-month limit.
16. Event dashboard card, organization overview and platform administration list.

17. Settings page "Data & deletion" with the periods, both deletions and event
    deletion; the dashboard card becomes a summary.

**Phase 6 — rollout and conveniences** (done)

18. A warning on the event dashboard while registration is open or scheduled and
    the privacy check refuses it (section 5). No legacy list, no migration.
19. ~~Keyword hint in the form editor~~ — dropped, see section 5.
20. Translation completeness per locale. Tightens completeness like item 12; release
    both together with one announcement to organizers.

**Phase 7 — consent purposes** (section 5, done)

21. `privacyConsentPurpose`, and "Unlocks sensitive data" shown only while the
    form tags a special category.
22. `newsletterConsent` derived from the newsletter purpose beside the consent
    wording; `eventDataType: 'newsletter_consent'` removed; presets updated; a data
    migration of saved forms.

**Waiting for legal review:** Art. 9(2)(g) and its legal reference, the "necessary
for participation" option, self-service withdrawal, platform policy versioning,
Art. 14 for emergency contacts, church data protection law.
