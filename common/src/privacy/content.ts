import type { Translatable } from '../entities/Translatable.js';
import type { PrivacyNoticeCompleteness } from './completeness.js';
import type {
  LegalBasisKey,
  PrivacyDataCategoryRef,
  PrivacyPurposeRef,
  PrivacyRecipientKey,
  SpecialCategoryBasisKey,
} from './catalogue.js';
import {
  ALWAYS_RECIPIENT_KEYS,
  RETENTION_ANCHORS,
  TRANSFER_SAFEGUARDS,
} from './catalogue.js';

/**
 * How the notice was written.
 *
 * `builder` assembles it from the catalogue, which is what makes it renderable
 * in every language a camp runs in. `free_text` hands the whole thing to the
 * organization — necessary for anyone whose processing the catalogue cannot
 * express, or who already has counsel-drafted wording, but it forfeits the
 * automatic translation and the structural completeness check.
 */
export type PrivacyNoticeMode = 'builder' | 'free_text';

export interface PrivacyPurposeEntry {
  key: PrivacyPurposeRef;
  legalBasis: LegalBasisKey;
  /** Required when `legalBasis` is `legitimate_interests`. Art. 13(1)(d). */
  legitimateInterest?: Translatable | null;
  /** What to call it. Set only on `custom:` entries. */
  label?: Translatable | null;
}

export interface PrivacyDataCategoryEntry {
  key: PrivacyDataCategoryRef;
  /** Only meaningful for special categories; see `isSpecialCategory`. */
  specialCategoryBasis?: SpecialCategoryBasisKey | null;
  /** What to call it. Set only on `custom:` entries. */
  label?: Translatable | null;
  /**
   * Whether Art. 9 applies. Set only on `custom:` entries — for catalogue keys
   * this is decided by `SPECIAL_CATEGORY_DATA_KEYS`, not by the author.
   */
  special?: boolean;
}

/**
 * A recipient the notice names. `name` is optional because Art. 13(1)(e)
 * accepts categories of recipients, which is what the catalogue key alone
 * expresses; naming the actual caterer is better practice and stays available.
 */
export interface PrivacyRecipientEntry {
  key: PrivacyRecipientKey;
  name?: string | null;
  /** ISO 3166-1 alpha-2. Drives the third-country transfer disclosure. */
  country?: string | null;
}

export type RetentionAnchor = (typeof RETENTION_ANCHORS)[number];

/**
 * Something the baseline period does not cover, e.g. invoices a tax law says to
 * keep for ten years.
 *
 * `scope` reuses the purpose refs rather than introducing a second vocabulary:
 * a purpose the organization already selected is named and translated for free,
 * and `custom:<id>` covers anything the catalogue does not have. Nothing here
 * is a fixed list the author has to squeeze an exception into.
 */
export interface PrivacyRetentionException {
  scope: PrivacyPurposeRef;
  /** What to call it. Set only on `custom:` scopes. */
  label?: Translatable | null;
  months: number;
  anchor: RetentionAnchor;
  /** Why it outlives the baseline, e.g. the statutory duty behind it. */
  reason?: Translatable | null;
}

export interface PrivacyRetention {
  months: number;
  anchor: RetentionAnchor;
  /**
   * Empty for the great majority of camps: one baseline period is the whole
   * answer, and the author never has to categorise anything.
   */
  exceptions: PrivacyRetentionException[];
}

export type TransferSafeguard = (typeof TRANSFER_SAFEGUARDS)[number];

export interface PrivacyThirdCountryTransfers {
  enabled: boolean;
  /** ISO 3166-1 alpha-2 codes outside the EEA. */
  countries: string[];
  safeguard?: TransferSafeguard | null;
  note?: Translatable | null;
}

export interface PrivacyDataProtectionOfficer {
  name: string;
  email: string;
}

/**
 * Everything the controller decides. Deliberately does *not* carry controller
 * identity: name, address, country, registration number and contact details are
 * already on `Organization`, and duplicating them here would let the two drift
 * apart with no way to tell which the registrant was shown.
 *
 * Nor does it carry data-subject rights, the complaint right or the competent
 * supervisory authority — those are fixed by law, identical for every
 * organization, and are generated from `Organization.country`.
 */
export interface PrivacyNoticeContent {
  mode: PrivacyNoticeMode;
  purposes: PrivacyPurposeEntry[];
  dataCategories: PrivacyDataCategoryEntry[];
  recipients: PrivacyRecipientEntry[];
  retention: PrivacyRetention | null;
  thirdCountryTransfers: PrivacyThirdCountryTransfers;
  dpo: PrivacyDataProtectionOfficer | null;
  /** Art. 13(2)(f). Rare for a camp, but silence is not an answer. */
  automatedDecisionMaking: boolean;
  /**
   * Art. 13(2)(f) again: once automated decision-making exists, the notice owes
   * "meaningful information about the logic involved, as well as the
   * significance and the envisaged consequences". A boolean cannot carry that,
   * and the logic is specific to the organization, so this is free text.
   */
  automatedDecisionMakingDetails: Translatable | null;
  /** Escape hatch for processing the catalogue does not describe. HTML. */
  additional: Translatable | null;
  /**
   * The whole notice, when `mode` is `free_text`. Kept separate from
   * `additional` so switching modes is reversible and neither draft is lost.
   */
  freeText: Translatable | null;
}

/**
 * A camp's additions to its organization's notice. Every field is optional:
 * the camp says only what differs, and `composePrivacyNotice` merges the rest.
 */
export interface PrivacyNoticeAddendum {
  purposes?: PrivacyPurposeEntry[];
  dataCategories?: PrivacyDataCategoryEntry[];
  recipients?: PrivacyRecipientEntry[];
  retention?: PrivacyRetention | null;
  thirdCountryTransfers?: PrivacyThirdCountryTransfers | null;
  additional?: Translatable | null;
}

/** Whether the camp says anything of its own yet. */
export function isEmptyAddendum(addendum: PrivacyNoticeAddendum): boolean {
  return (
    !addendum.purposes?.length &&
    !addendum.dataCategories?.length &&
    !addendum.recipients?.length &&
    !addendum.retention &&
    !addendum.thirdCountryTransfers &&
    !addendum.additional
  );
}

export function emptyPrivacyNoticeContent(): PrivacyNoticeContent {
  return {
    mode: 'builder',
    purposes: [],
    dataCategories: [],
    recipients: ALWAYS_RECIPIENT_KEYS.map((key) => ({ key })),
    // A real value, not just a placeholder in the editor's getter: the field
    // showed 24 while the notice stored nothing, so the author had to retype
    // the number they could already see to clear the completeness gap.
    retention: { months: 24, anchor: 'camp_end', exceptions: [] },
    thirdCountryTransfers: { enabled: false, countries: [] },
    dpo: null,
    automatedDecisionMaking: false,
    automatedDecisionMakingDetails: null,
    additional: null,
    freeText: null,
  };
}

/**
 * What the editor loads: the published notice itself. There is no draft — an
 * unpublished edit exists only in the author's browser, so everything here is
 * what registrants are currently being shown.
 */
export interface OrganizationPrivacyNotice {
  content: PrivacyNoticeContent;
  publishedVersion: number | null;
  publishedAt: string | null;
}

/**
 * The notice as the editor receives it. The completeness result travels with
 * it so the wizard's progress meter and the server's publish check can never
 * disagree — both read the one `privacyNoticeCompleteness`.
 */
export interface OrganizationPrivacyNoticeDetails extends OrganizationPrivacyNotice {
  completeness: PrivacyNoticeCompleteness;
}

export type PrivacyNoticeUpdateData = Pick<
  OrganizationPrivacyNotice,
  'content'
>;

/**
 * What a camp manager authors against: the camp's own additions plus the
 * organization notice they are added to.
 *
 * The baseline is the published organization content — that is what registrants
 * read, so it is what the camp is actually adding to. Without it the editor
 * cannot tell an author which entries the organization has already declared,
 * and a camp's list looks the same whether it repeats the organization or adds
 * to it.
 */
export interface CampPrivacyNotice {
  content: PrivacyNoticeAddendum;
  /** Null while the organization has published nothing at all. */
  organizationContent: PrivacyNoticeContent | null;
  organizationPublishedVersion: number | null;
  organizationPublishedAt: string | null;
  publishedVersion: number | null;
  publishedAt: string | null;
}

export type CampPrivacyNoticeUpdateData = Pick<CampPrivacyNotice, 'content'>;
