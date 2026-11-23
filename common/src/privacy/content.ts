import type { Translatable } from '../entities/Translatable.js';
import type { PrivacyNoticeCompleteness } from './completeness.js';
import type {
  LegalBasisKey,
  PrivacyDataCategoryRef,
  PrivacyPurposeRef,
  PrivacyRecipientRef,
  SpecialCategoryBasisKey,
} from './catalogue.js';
import type { PrivacyNoticeExclusions } from './exclusions.js';
import { ALWAYS_RECIPIENT_KEYS, TRANSFER_SAFEGUARDS } from './catalogue.js';
import { frameworkRecord } from './frameworks.js';

/**
 * How the notice was written.
 *
 * `builder` assembles it from the catalogue, which is what makes it renderable
 * in every language an event runs in. `free_text` hands the whole thing to the
 * organization — necessary for anyone whose processing the catalogue cannot
 * express, or who already has counsel-drafted wording, but it forfeits the
 * automatic translation and the structural completeness check.
 */
export type PrivacyNoticeMode = 'builder' | 'free_text';

/**
 * The data protection law a guided notice is written under (docs/privacy.md,
 * 4): the GDPR or a German church law the platform has a record of. Declared
 * by the organization, never inferred — neither country nor name tells. A
 * free-text notice has none: the organization's text is the whole notice.
 */
export const DATA_PROTECTION_FRAMEWORKS = ['gdpr', 'kdg', 'dsg_ekd'] as const;
export type DataProtectionFramework =
  (typeof DATA_PROTECTION_FRAMEWORKS)[number];

/** The church laws are German; elsewhere only the GDPR. */
const COUNTRY_FRAMEWORKS: Record<string, readonly DataProtectionFramework[]> = {
  de: ['kdg', 'dsg_ekd'],
};

/**
 * The frameworks an organization in `country` (lowercase, like
 * `Organization.country`) can write a guided notice under.
 */
export function frameworksFor(country: string): DataProtectionFramework[] {
  return ['gdpr', ...(COUNTRY_FRAMEWORKS[country] ?? [])];
}

/** Versions published before the setting existed were GDPR notices. */
export function noticeFramework(
  content: Pick<PrivacyNoticeContent, 'framework'> | null | undefined,
): DataProtectionFramework {
  return content?.framework ?? 'gdpr';
}

/**
 * Whether the platform adds legal text of its own — rights, the complaint
 * right, the supervisory authority. A guided notice gets it from its law's
 * record (`frameworkRecord`). A free-text notice is the organization's text
 * alone, except a version published before the framework setting existed
 * (no `framework` key at all): its author was told those sections were added,
 * so they still are. Publishing again drops them.
 */
export function generatesLegalText(
  content: Pick<PrivacyNoticeContent, 'framework' | 'mode'> | null | undefined,
): boolean {
  if (content?.mode === 'free_text') {
    return content.framework === undefined;
  }
  return frameworkRecord(noticeFramework(content)) !== null;
}

/** A supervisory authority the organizer names, where none is derived. */
export interface PrivacyNoticeAuthority {
  name: string;
  website?: string | null;
}

export interface PrivacyPurposeEntry {
  key: PrivacyPurposeRef;
  /**
   * Null until the author picks one: a preset leaves it open where the law
   * attaches conditions to its basis (`presetLegalBasis`). Publishing needs it.
   */
  legalBasis: LegalBasisKey | null;
  /** Required when `legalBasis` is `legitimate_interests`. Art. 13(1)(d). */
  legitimateInterest?: Translatable | null;
  /** What to call it. Set only on `custom:` entries. */
  label?: Translatable | null;
  /** Applies to every event: events cannot exclude it. */
  allEvents?: boolean | null;
}

export interface PrivacyDataCategoryEntry {
  key: PrivacyDataCategoryRef;
  /** Only meaningful for special categories; see `isSpecialCategory`. */
  specialCategoryBasis?: SpecialCategoryBasisKey | null;
  /**
   * The law a `public_interest` basis rests on (Art. 9(2)(g)), as the
   * organizer names it; see `needsLegalReference`.
   */
  legalReference?: Translatable | null;
  /** What to call it. Set only on `custom:` entries. */
  label?: Translatable | null;
  /**
   * Whether Art. 9 applies. Set only on `custom:` entries — for catalogue keys
   * this is decided by `SPECIAL_CATEGORY_DATA_KEYS`, not by the author.
   */
  special?: boolean;
  /** Applies to every event: events cannot exclude it. */
  allEvents?: boolean | null;
}

/**
 * A recipient the notice names. `name` is optional because Art. 13(1)(e)
 * accepts categories of recipients, which is what the catalogue key alone
 * expresses; naming the actual caterer is better practice and stays available.
 */
export interface PrivacyRecipientEntry {
  key: PrivacyRecipientRef;
  /** What to call it. Set only on `custom:` entries. */
  label?: Translatable | null;
  name?: string | null;
  /** ISO 3166-1 alpha-2. Drives the third-country transfer disclosure. */
  country?: string | null;
  /** Applies to every event: events cannot exclude it. */
  allEvents?: boolean | null;
}

/**
 * Something the baseline period does not cover, e.g. invoices a tax law says to
 * keep for ten years.
 *
 * `scope` reuses the purpose refs rather than introducing a second vocabulary:
 * a purpose the organization already selected is named and translated for free,
 * and `custom:<id>` covers anything the catalogue does not have. Nothing here
 * is a fixed list the author has to squeeze an exception into.
 */
interface PrivacyRetentionExceptionBase {
  scope: PrivacyPurposeRef;
  /** What to call it. Set only on `custom:` scopes. */
  label?: Translatable | null;
  /** Why it outlives the baseline, e.g. the statutory duty behind it. */
  reason?: Translatable | null;
}

/**
 * An exception that still ends on a date — a longer period.
 *
 * `until` is optional rather than required because exceptions existed before
 * there was anything to distinguish: a version published back then has no
 * discriminator, and rewriting stored notices to add one is not an option when
 * a registration points at the exact bytes it was shown.
 */
export interface PrivacyRetentionPeriodException extends PrivacyRetentionExceptionBase {
  until?: 'period';
  months: number;
}

/**
 * Data kept for as long as the consent behind it stands — a published photo,
 * a newsletter subscription — and erased once it is withdrawn.
 *
 * There is deliberately no period here. Naming one would be a promise the
 * controller cannot keep in either direction: it may not delete on schedule
 * what the person still consents to appearing, and it may not keep to the
 * schedule once the person withdraws. What bounds this is the withdrawal, so
 * that is what the notice says.
 *
 * Only lawful where the purpose it scopes to actually rests on consent —
 * otherwise it is indefinite storage with nothing to end it, which is the
 * storage-limitation breach this looks like. `privacyNoticeCompleteness`
 * enforces that link.
 */
export interface PrivacyRetentionConsentException extends PrivacyRetentionExceptionBase {
  until: 'consent_withdrawn';
  /**
   * The upper limit for consent nobody withdraws: without one, the data would be
   * kept indefinitely. Optional only because versions published before it
   * existed have none; the completeness check requires it.
   */
  months?: number;
}

export type PrivacyRetentionException =
  PrivacyRetentionPeriodException | PrivacyRetentionConsentException;

export function isConsentBoundException(
  exception: PrivacyRetentionException,
): exception is PrivacyRetentionConsentException {
  return exception.until === 'consent_withdrawn';
}

/**
 * Every period counts from the end of the event: the data is needed until the
 * event is over, and a date counted from each registration could fall due
 * before the event even takes place. Versions published while a period could
 * also count from submission store an `anchor`; none in use chose another
 * value, so it is ignored.
 */
export interface PrivacyRetention {
  months: number;
  /**
   * Empty for the great majority of events: one baseline period is the whole
   * answer, and the author never has to categorise anything.
   */
  exceptions: PrivacyRetentionException[];
  /**
   * How long answers in special categories (Art. 9) are kept — usually only
   * until shortly after the event, well before the rest. Optional only because
   * older versions have none; the completeness check requires it.
   */
  specialCategories?: PrivacySpecialCategoryRetention | null;
}

export interface PrivacySpecialCategoryRetention {
  weeks: number;
}

/** Weeks a sensitive-data period may not exceed, given the main period. */
export function maxSpecialCategoryWeeks(months: number): number {
  return months * 4;
}

export type TransferSafeguard = (typeof TRANSFER_SAFEGUARDS)[number];

export interface PrivacyThirdCountryTransfers {
  enabled: boolean;
  /** Lowercase ISO 3166-1 alpha-2 codes outside the EEA. */
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
 * supervisory authority — under the GDPR those are fixed by law, identical for
 * every organization, and are generated from `Organization.country`.
 */
export interface PrivacyNoticeContent {
  /**
   * The law of a guided notice. Absent on versions from before it existed:
   * GDPR. Null on a free-text notice, which cites no law.
   */
  framework?: DataProtectionFramework | null;
  /**
   * The record version the notice was published with (`FrameworkRecord`).
   * Set by the server, so a later renumbering never changes what was shown.
   */
  frameworkVersion?: string | null;
  /** Named by the organizer where the law's record derives none. */
  supervisoryAuthority?: PrivacyNoticeAuthority | null;
  mode: PrivacyNoticeMode;
  purposes: PrivacyPurposeEntry[];
  dataCategories: PrivacyDataCategoryEntry[];
  recipients: PrivacyRecipientEntry[];
  retention: PrivacyRetention | null;
  thirdCountryTransfers: PrivacyThirdCountryTransfers;
  dpo: PrivacyDataProtectionOfficer | null;
  /** Art. 13(2)(f). Rare for an event, but silence is not an answer. */
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
 * A event's additions to its organization's notice. Every field is optional:
 * the event says only what differs, and `composePrivacyNotice` merges the rest.
 */
export interface PrivacyNoticeAddendum {
  purposes?: PrivacyPurposeEntry[];
  dataCategories?: PrivacyDataCategoryEntry[];
  recipients?: PrivacyRecipientEntry[];
  retention?: PrivacyRetention | null;
  thirdCountryTransfers?: PrivacyThirdCountryTransfers | null;
  additional?: Translatable | null;
  /** Organization entries this event drops; see `appliedExclusions`. */
  excluded?: PrivacyNoticeExclusions | null;
}

/** Whether the event says anything of its own yet. */
export function isEmptyAddendum(addendum: PrivacyNoticeAddendum): boolean {
  return (
    !addendum.purposes?.length &&
    !addendum.dataCategories?.length &&
    !addendum.recipients?.length &&
    !addendum.retention &&
    !addendum.thirdCountryTransfers &&
    !addendum.additional &&
    !hasExclusions(addendum.excluded)
  );
}

function hasExclusions(excluded: PrivacyNoticeExclusions | null | undefined) {
  return Object.values(excluded ?? {}).some(
    (keys) => Array.isArray(keys) && keys.length > 0,
  );
}

/** Whether the event adds anything besides its own free text. */
export function hasStructuredEntries(addendum: PrivacyNoticeAddendum): boolean {
  return !isEmptyAddendum({ ...addendum, additional: null });
}

/**
 * What of an addendum registrants can actually be shown. A free-text
 * organization notice has no structure for entries to join, so only the
 * event's own text survives composition.
 */
export function publishableAddendum(
  organization: PrivacyNoticeContent | null,
  addendum: PrivacyNoticeAddendum,
): PrivacyNoticeAddendum {
  return organization?.mode === 'free_text'
    ? { additional: addendum.additional ?? null }
    : addendum;
}

export function emptyPrivacyNoticeContent(): PrivacyNoticeContent {
  return {
    framework: 'gdpr',
    mode: 'builder',
    purposes: [],
    dataCategories: [],
    recipients: ALWAYS_RECIPIENT_KEYS.map((key) => ({ key })),
    // A real value, not just a placeholder in the editor's getter: the field
    // showed 24 while the notice stored nothing, so the author had to retype
    // the number they could already see to clear the completeness gap.
    retention: {
      months: 24,
      exceptions: [],
      specialCategories: { weeks: 4 },
    },
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
  /** Every locale the organization's events are offered in. */
  requiredLocales: string[];
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
 * What an event manager authors against: the event's own additions plus the
 * organization notice they are added to.
 *
 * The baseline is the published organization content — that is what registrants
 * read, so it is what the event is actually adding to. Without it the editor
 * cannot tell an author which entries the organization has already declared,
 * and an event's list looks the same whether it repeats the organization or adds
 * to it.
 */
export interface EventPrivacyNotice {
  /** The locales the event is offered in. */
  requiredLocales: string[];
  content: PrivacyNoticeAddendum;
  /** Null while the organization has published nothing at all. */
  organizationContent: PrivacyNoticeContent | null;
  organizationPublishedVersion: number | null;
  organizationPublishedAt: string | null;
  publishedVersion: number | null;
  publishedAt: string | null;
}

export type EventPrivacyNoticeUpdateData = Pick<EventPrivacyNotice, 'content'>;
