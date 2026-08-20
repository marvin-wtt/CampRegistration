/**
 * The preset catalogue a privacy notice is assembled from.
 *
 * Registration forms are authored per camp and fully dynamic, so the platform
 * cannot infer what a camp processes. Rather than asking an organization to
 * write Art. 13 prose — which it would then have to translate into every
 * language its camps are offered in — it ticks entries from this catalogue and
 * the application renders the legal text, pre-translated, from the keys.
 *
 * Adding a key here means adding its label to all five locales. A key that has
 * no translation is a notice a registrant cannot read, which Art. 12 treats as
 * no notice at all.
 *
 * The catalogue is deliberately kept at the altitude of *categories*, not form
 * fields. Anything narrower than a category an organization would recognise in
 * its own record of processing belongs in a custom entry (`custom:<id>`), not
 * here — otherwise the list grows into a form inventory that no two camps fill
 * in the same way.
 */

/**
 * Every key list is a runtime array with its type derived from it, not the
 * other way round: the wizard renders the catalogue in this order and the
 * backend validation schema is built from the same values, so a key can never
 * exist for one and not the other.
 *
 * **Order is meaning here.** Each list runs from what a camp almost always
 * needs to what it rarely does, so the author reads down and stops. Re-sorting
 * alphabetically would bury `identity` under `allergies`.
 */

/** Why the organization processes the data. Art. 13(1)(c). */
export const PRIVACY_PURPOSE_KEYS = [
  'registration_administration',
  'participant_communication',
  'camp_organisation',
  'catering',
  'medical_care',
  'emergency_contact',
  'payment_and_invoicing',
  'photo_documentation',
  'photo_publication',
  'transport',
  'insurance',
  'newsletter',
  'statutory_reporting',
] as const;

export type PrivacyPurposeKey = (typeof PRIVACY_PURPOSE_KEYS)[number];

/** What is collected. Art. 13 does not require this, Art. 12 transparency does. */
export const PRIVACY_DATA_CATEGORY_KEYS = [
  'identity',
  'contact',
  'guardian_contact',
  'date_of_birth',
  'address',
  'emergency_contact',
  'gender',
  'dietary',
  'allergies',
  'health',
  'medication',
  'photos',
  'payment',
  'insurance_details',
  'disability_support',
  'nationality',
  'identity_document',
  'religion',
] as const;

export type PrivacyDataCategoryKey =
  (typeof PRIVACY_DATA_CATEGORY_KEYS)[number];

/** Who else sees it. Art. 13(1)(e). */
export const PRIVACY_RECIPIENT_KEYS = [
  'camp_staff',
  'platform_operator',
  'accommodation_provider',
  'catering_provider',
  'medical_provider',
  'transport_provider',
  'insurer',
  'funding_body',
  'payment_provider',
  'public_authority',
] as const;

export type PrivacyRecipientKey = (typeof PRIVACY_RECIPIENT_KEYS)[number];

/**
 * Recipients that exist by construction, so the author confirms them rather
 * than choosing them.
 *
 * The camp team necessarily sees the registration — that is what running a camp
 * is — and the platform operator processes every submission as a processor,
 * which Art. 4(9) still counts as a recipient. Offering these as free
 * checkboxes let an organization publish a notice claiming the data goes
 * nowhere, which is untrue of every camp on the platform.
 */
export const ALWAYS_RECIPIENT_KEYS = [
  'camp_staff',
  'platform_operator',
] as const satisfies readonly PrivacyRecipientKey[];

export function isAlwaysRecipient(key: PrivacyRecipientKey): boolean {
  return (ALWAYS_RECIPIENT_KEYS as readonly string[]).includes(key);
}

/**
 * Art. 6(1), every point that a camp organization can actually rely on.
 *
 * `public_task` (Art. 6(1)(e)) is in the list because municipal youth offices
 * run camps under official authority rather than under a contract. All six
 * points of Art. 6(1) are therefore represented.
 */
export const LEGAL_BASIS_KEYS = [
  'contract',
  'consent',
  'legitimate_interests',
  'vital_interests',
  'legal_obligation',
  'public_task',
] as const;

export type LegalBasisKey = (typeof LEGAL_BASIS_KEYS)[number];

/**
 * Art. 9(2). Processing special categories needs a basis of its own on top of
 * the Art. 6 one — a contract never suffices for health data.
 *
 * Only the points a camp can genuinely rely on are offered. Deliberately absent:
 * (b) employment and social security law, which governs staff rather than
 * registrants; (e) data the subject manifestly made public; (g) substantial
 * public interest, which needs a Member State law to rest on; (i) public
 * health, which is for public-health bodies; and (j) archiving and research.
 * Offering a basis nobody may lawfully pick is worse than omitting it — the
 * whole point of a preset is that picking it is safe.
 */
export const SPECIAL_CATEGORY_BASIS_KEYS = [
  'explicit_consent',
  'nonprofit_body',
  'vital_interests',
  'health_care',
  'legal_claims',
] as const;

export type SpecialCategoryBasisKey =
  (typeof SPECIAL_CATEGORY_BASIS_KEYS)[number];

/**
 * The four alternatives to explicit consent, each of which only applies under a
 * condition most camps do not meet. Kept out of the way in the authoring UI: a
 * flat list of five invites picking whichever sounds nicest, when in practice
 * one is right and four are traps.
 */
export const ADVANCED_SPECIAL_CATEGORY_BASIS_KEYS = [
  'nonprofit_body',
  'vital_interests',
  'health_care',
  'legal_claims',
] as const satisfies readonly SpecialCategoryBasisKey[];

/**
 * A camp is not a health-care provider, so Art. 9(2)(h) rarely fits, and
 * (c) vital interests only covers an emergency in which the subject cannot
 * consent — a fallback during an incident, not a basis for collecting the data
 * at registration. Explicit consent is what almost every camp actually relies
 * on, so it is pre-selected the moment a special category is ticked.
 */
export const DEFAULT_SPECIAL_CATEGORY_BASIS: SpecialCategoryBasisKey =
  'explicit_consent';

export const RETENTION_ANCHORS = ['camp_end', 'submission'] as const;

export const TRANSFER_SAFEGUARDS = [
  'adequacy',
  'scc',
  'derogation',
  'bcr',
] as const;

/**
 * A catalogue entry the organization named itself, for processing the presets
 * do not describe. Prefixed rather than held in a second array so that merging,
 * completeness and rendering keep treating one list of entries.
 */
export type CustomKey = `custom:${string}`;

export function isCustomKey(key: string): key is CustomKey {
  return key.startsWith('custom:');
}

export function customKey(id: string): CustomKey {
  return `custom:${id}`;
}

/**
 * The lowest `custom:<n>` not already taken. Derived from what exists rather
 * than from a list length, so removing an entry cannot make the next one
 * collide with a survivor.
 */
export function nextCustomKey(existing: readonly { key: string }[]): CustomKey {
  const taken = new Set(existing.map((entry) => entry.key));
  let index = 1;
  while (taken.has(customKey(String(index)))) {
    index += 1;
  }

  return customKey(String(index));
}

export type PrivacyPurposeRef = PrivacyPurposeKey | CustomKey;
export type PrivacyDataCategoryRef = PrivacyDataCategoryKey | CustomKey;

/**
 * Categories that are special under Art. 9 in every case, and so always pull in
 * a second legal basis.
 *
 * A custom category carries its own `special` flag instead — the catalogue
 * cannot know what an organization put there.
 */
export const SPECIAL_CATEGORY_DATA_KEYS = [
  'health',
  'disability_support',
  'allergies',
  'medication',
  'religion',
] as const satisfies readonly PrivacyDataCategoryKey[];

/**
 * Categories that are special only depending on what the camp's form actually
 * captures, so the author is prompted rather than forced.
 *
 * `dietary` used to sit in the list above on the theory that a dietary
 * requirement reveals religious belief. That over-applies: "vegetarian",
 * "no mushrooms" and "lactose intolerant" reveal nothing under Art. 9, and
 * treating every camp's dietary field as sensitive dragged the whole platform
 * into an Art. 9 basis it usually does not need. Art. 9(1) bites where data
 * *reveals* a listed characteristic — so a form that offers halal or kosher, or
 * a free-text box that collects allergies, does need one, and the author is the
 * only one who knows which. The prompt points them at `religion` and
 * `allergies`, which are already catalogue entries of their own.
 */
export const ADVISORY_SPECIAL_CATEGORY_DATA_KEYS = [
  'dietary',
] as const satisfies readonly PrivacyDataCategoryKey[];

export function isAdvisorySpecialCategory(
  key: PrivacyDataCategoryRef,
): boolean {
  return (ADVISORY_SPECIAL_CATEGORY_DATA_KEYS as readonly string[]).includes(
    key,
  );
}

export type SpecialCategoryDataKey =
  (typeof SPECIAL_CATEGORY_DATA_KEYS)[number];

/**
 * Categories nothing but the registrant's agreement makes lawful, whatever the
 * notice says about them. Art. 7 wants consent given by a clear affirmative act
 * and Art. 7(4) wants it refusable, so the form has to carry a question of its
 * own that a registration can be submitted without.
 *
 * The same is true of any purpose whose Art. 6 basis is `consent`; that one is
 * read off the entry rather than listed here. This list is for the categories
 * such a purpose collects, which reach a camp's addendum on their own — a camp
 * ticks `photos` without ever seeing the purpose its organization tied to it.
 */
export const CONSENT_DATA_CATEGORY_KEYS = [
  'photos',
] as const satisfies readonly PrivacyDataCategoryKey[];

export function requiresConsentQuestion(key: PrivacyDataCategoryRef): boolean {
  return (CONSENT_DATA_CATEGORY_KEYS as readonly string[]).includes(key);
}

export function isSpecialCategory(
  key: PrivacyDataCategoryRef,
): key is SpecialCategoryDataKey {
  return (SPECIAL_CATEGORY_DATA_KEYS as readonly string[]).includes(key);
}

/**
 * What ticking a purpose suggests for the remaining steps. The suggestions are
 * pre-selected in the wizard and stay editable — they exist to make the common
 * camp a handful of clicks, not to decide for the controller.
 */
export interface PrivacyPurposePreset {
  legalBasis: LegalBasisKey;
  dataCategories: readonly PrivacyDataCategoryKey[];
  recipients: readonly PrivacyRecipientKey[];
}

export const PRIVACY_PURPOSE_PRESETS: Record<
  PrivacyPurposeKey,
  PrivacyPurposePreset
> = {
  registration_administration: {
    legalBasis: 'contract',
    dataCategories: [
      'identity',
      'date_of_birth',
      'contact',
      'guardian_contact',
      'address',
    ],
    recipients: ['camp_staff', 'platform_operator'],
  },
  participant_communication: {
    legalBasis: 'contract',
    dataCategories: ['identity', 'contact', 'guardian_contact'],
    recipients: ['camp_staff', 'platform_operator'],
  },
  // Deliberately broader than "assigning rooms": allocating rooms, groups and
  // activities is one purpose — running the camp — and splitting it out invited
  // a notice that read like an operations manual.
  camp_organisation: {
    legalBasis: 'contract',
    dataCategories: ['identity', 'date_of_birth', 'gender'],
    recipients: ['camp_staff', 'accommodation_provider'],
  },
  catering: {
    legalBasis: 'contract',
    dataCategories: ['dietary', 'allergies'],
    recipients: ['camp_staff', 'catering_provider'],
  },
  medical_care: {
    legalBasis: 'contract',
    dataCategories: [
      'health',
      'allergies',
      'medication',
      'disability_support',
      'insurance_details',
    ],
    recipients: ['camp_staff', 'medical_provider'],
  },
  emergency_contact: {
    legalBasis: 'vital_interests',
    dataCategories: ['emergency_contact', 'guardian_contact'],
    recipients: ['camp_staff', 'medical_provider'],
  },
  transport: {
    legalBasis: 'contract',
    dataCategories: ['identity', 'address'],
    recipients: ['camp_staff', 'transport_provider'],
  },
  insurance: {
    legalBasis: 'contract',
    dataCategories: [
      'identity',
      'date_of_birth',
      'address',
      'insurance_details',
    ],
    recipients: ['insurer'],
  },
  payment_and_invoicing: {
    legalBasis: 'contract',
    dataCategories: ['identity', 'address', 'payment'],
    recipients: ['payment_provider'],
  },
  // The split between documenting camp life and publishing the result is the
  // legally important one in this list: the first can rest on a legitimate
  // interest, the second needs consent that must be as easy to withdraw as to
  // give. Do not merge them.
  photo_documentation: {
    legalBasis: 'legitimate_interests',
    dataCategories: ['photos'],
    recipients: ['camp_staff'],
  },
  photo_publication: {
    legalBasis: 'consent',
    dataCategories: ['photos', 'identity'],
    recipients: [],
  },
  statutory_reporting: {
    legalBasis: 'legal_obligation',
    dataCategories: ['identity', 'date_of_birth', 'nationality'],
    recipients: ['public_authority'],
  },
  newsletter: {
    legalBasis: 'consent',
    dataCategories: ['identity', 'contact'],
    recipients: ['platform_operator'],
  },
};

/**
 * Maps the `campDataType` a form author already tags questions with
 * (`common/src/form/properties/campDataType.ts`) onto a data category, so the
 * wizard can propose what the camp's own form appears to collect.
 *
 * A suggestion only — the mapping is partial by construction, since a free-text
 * question can hold anything.
 */
export const CAMP_DATA_TYPE_DATA_CATEGORIES: Record<
  string,
  PrivacyDataCategoryKey
> = {
  first_name: 'identity',
  last_name: 'identity',
  name: 'identity',
  email: 'contact',
  phone: 'contact',
  address: 'address',
  country: 'address',
  date_of_birth: 'date_of_birth',
  gender: 'gender',
};
