import type { Translatable } from '../entities/Translatable.js';
import { COUNTRY_LOCALES } from '../locales.js';
import {
  isCustomKey,
  isSpecialCategory,
  needsLegalReference,
} from './catalogue.js';
import { composePrivacyNotice, retentionExceptions } from './compose.js';
import { frameworkRecord } from './frameworks.js';
import {
  isConsentBoundException,
  noticeFramework,
  maxSpecialCategoryWeeks,
  type PrivacyNoticeAddendum,
  type PrivacyNoticeContent,
} from './content.js';

/**
 * A missing Art. 13 item. One implementation, four callers: the wizard's
 * progress meter, the moderator's review card, the server-side check that
 * refuses to verify an organization whose notice is incomplete, and — through
 * `addendumGaps` — the same check applied to what an event adds. Splitting it
 * would let the client claim complete where the server disagrees.
 */
export type PrivacyNoticeGap =
  | 'purposes'
  | 'purpose_basis'
  | 'legitimate_interest_explanation'
  | 'custom_purpose_label'
  | 'data_categories'
  | 'special_category_basis'
  | 'special_category_legal_reference'
  | 'custom_category_label'
  | 'custom_recipient_label'
  | 'recipients'
  | 'retention'
  | 'retention_exception'
  | 'retention_exception_consent_basis'
  | 'special_category_retention'
  | 'transfer_countries'
  | 'transfer_safeguard'
  | 'dpo_details'
  | 'supervisory_authority'
  | 'automated_details'
  | 'free_text';

/**
 * Which step of the authoring wizard a gap belongs to, so the stepper can mark
 * exactly the step that needs attention. Lives here rather than in the
 * component because the gap list is defined here — a new gap with no section
 * would otherwise fail silently in the UI.
 */
export type PrivacyNoticeSection =
  'controller' | 'data' | 'purposes' | 'recipients' | 'retention' | 'free_text';

export const PRIVACY_NOTICE_GAP_SECTIONS: Record<
  PrivacyNoticeGap,
  PrivacyNoticeSection
> = {
  purposes: 'purposes',
  purpose_basis: 'purposes',
  legitimate_interest_explanation: 'purposes',
  custom_purpose_label: 'purposes',
  data_categories: 'data',
  special_category_basis: 'data',
  special_category_legal_reference: 'data',
  custom_category_label: 'data',
  custom_recipient_label: 'recipients',
  recipients: 'recipients',
  retention: 'retention',
  retention_exception: 'retention',
  retention_exception_consent_basis: 'retention',
  special_category_retention: 'retention',
  transfer_countries: 'retention',
  transfer_safeguard: 'retention',
  dpo_details: 'controller',
  supervisory_authority: 'controller',
  automated_details: 'retention',
  free_text: 'free_text',
};

export interface PrivacyNoticeCompleteness {
  complete: boolean;
  gaps: PrivacyNoticeGap[];
}

export function gapsInSection(
  gaps: readonly PrivacyNoticeGap[],
  section: PrivacyNoticeSection,
): PrivacyNoticeGap[] {
  return gaps.filter((gap) => PRIVACY_NOTICE_GAP_SECTIONS[gap] === section);
}

export interface PrivacyNoticeCompletenessOptions {
  /**
   * Locales the notice is read in. A translated text then needs every one of
   * them (Art. 12: in the reader's language); an untranslated text serves all.
   * Without it, text in any locale counts.
   */
  locales?: readonly string[] | undefined;
}

export function privacyNoticeCompleteness(
  content: PrivacyNoticeContent | null | undefined,
  { locales }: PrivacyNoticeCompletenessOptions = {},
): PrivacyNoticeCompleteness {
  const gaps: PrivacyNoticeGap[] = [];
  const isBlank = (value: Translatable | null | undefined): boolean =>
    isBlankIn(value, locales);

  if (!content) {
    return {
      complete: false,
      gaps: ['purposes', 'data_categories', 'recipients', 'retention'],
    };
  }

  // A guided notice under a church law names the authority the author entered.
  if (
    needsEnteredAuthority(content) &&
    !content.supervisoryAuthority?.name.trim()
  ) {
    gaps.push('supervisory_authority');
  }

  // Nothing structural to check when the organization wrote its own prose: the
  // only thing the platform can still tell is whether there is any text at all.
  if (content.mode === 'free_text') {
    if (isBlank(content.freeText)) {
      gaps.push('free_text');
    }

    return { complete: gaps.length === 0, gaps };
  }

  if (content.purposes.length === 0) {
    gaps.push('purposes');
  }

  // A preset leaves the basis open where the law attaches conditions to it.
  if (content.purposes.some((purpose) => !purpose.legalBasis)) {
    gaps.push('purpose_basis');
  }

  // Art. 13(1)(d): naming the interest is part of the basis, not optional colour.
  if (
    content.purposes.some(
      (purpose) =>
        purpose.legalBasis === 'legitimate_interests' &&
        isBlank(purpose.legitimateInterest),
    )
  ) {
    gaps.push('legitimate_interest_explanation');
  }

  if (
    content.purposes.some(
      (purpose) => isCustomKey(purpose.key) && isBlank(purpose.label),
    )
  ) {
    gaps.push('custom_purpose_label');
  }

  if (content.dataCategories.length === 0) {
    gaps.push('data_categories');
  }

  if (
    content.dataCategories.some(
      (category) =>
        (isSpecialCategory(category.key) ||
          (isCustomKey(category.key) && category.special === true)) &&
        !category.specialCategoryBasis,
    )
  ) {
    gaps.push('special_category_basis');
  }

  // Art. 9(2)(g) is only a basis with the law it rests on.
  if (
    content.dataCategories.some(
      (category) =>
        needsLegalReference(category.specialCategoryBasis) &&
        isBlank(category.legalReference),
    )
  ) {
    gaps.push('special_category_legal_reference');
  }

  if (
    content.dataCategories.some(
      (category) => isCustomKey(category.key) && isBlank(category.label),
    )
  ) {
    gaps.push('custom_category_label');
  }

  // Art. 13(1)(e) says "if any", but the platform operator processes every
  // registration, so an empty list is an oversight rather than a claim.
  if (content.recipients.length === 0) {
    gaps.push('recipients');
  }

  if (
    content.recipients.some(
      (recipient) => isCustomKey(recipient.key) && isBlank(recipient.label),
    )
  ) {
    gaps.push('custom_recipient_label');
  }

  if (!content.retention || content.retention.months <= 0) {
    gaps.push('retention');
  }

  const exceptions = retentionExceptions(content.retention);

  // An exception with no period says nothing, and one the author named himself
  // needs that name — the catalogue cannot supply it. A consent-bound exception
  // ends with the withdrawal, but still needs an upper limit for consent that
  // is never withdrawn.
  if (
    exceptions.some(
      (exception) =>
        !((exception.months ?? 0) > 0) ||
        (isCustomKey(exception.scope) && isBlank(exception.label)),
    )
  ) {
    gaps.push('retention_exception');
  }

  // "Kept until you withdraw your consent" is only an answer where there is a
  // consent to withdraw. Scoped to a purpose resting on any other basis it is
  // indefinite storage with nothing that ends it — Art. 5(1)(e) — so the link
  // to an Art. 6(1)(a) purpose is checked rather than assumed.
  const consentPurposes = new Set(
    content.purposes
      .filter((purpose) => purpose.legalBasis === 'consent')
      .map((purpose) => purpose.key),
  );

  if (
    exceptions.some(
      (exception) =>
        isConsentBoundException(exception) &&
        !consentPurposes.has(exception.scope),
    )
  ) {
    gaps.push('retention_exception_consent_basis');
  }

  // Required on every notice, not only one declaring a special category: an
  // event may add one, and events inherit this period rather than set it.
  const special = content.retention?.specialCategories;
  if (
    !special ||
    special.weeks <= 0 ||
    special.weeks > maxSpecialCategoryWeeks(content.retention?.months ?? 0)
  ) {
    gaps.push('special_category_retention');
  }

  if (content.thirdCountryTransfers.enabled) {
    if (content.thirdCountryTransfers.countries.length === 0) {
      gaps.push('transfer_countries');
    }
    if (!content.thirdCountryTransfers.safeguard) {
      gaps.push('transfer_safeguard');
    }
  }

  // Art. 13(1)(b): naming a DPO without contact details tells nobody anything.
  if (
    content.dpo &&
    (content.dpo.name.trim() === '' || content.dpo.email.trim() === '')
  ) {
    gaps.push('dpo_details');
  }

  // Art. 13(2)(f): declaring automated decision-making obliges the notice to
  // explain the logic, significance and consequences. The boolean alone is not
  // the disclosure.
  if (
    content.automatedDecisionMaking &&
    isBlank(content.automatedDecisionMakingDetails)
  ) {
    gaps.push('automated_details');
  }

  return { complete: gaps.length === 0, gaps };
}

function isBlankIn(
  value: Translatable | null | undefined,
  locales: readonly string[] | undefined,
): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  const filled = (text: string | undefined) =>
    typeof text === 'string' && text.trim().length > 0;
  // An event's texts are keyed by country (`gb`), so a locale counts as
  // written where it or a country writing it holds text.
  if (locales?.length) {
    const entries = Object.entries(value);
    return !locales.every((locale) =>
      entries.some(
        ([key, text]) =>
          filled(text) &&
          (key.toLowerCase() === locale ||
            COUNTRY_LOCALES[key.toLowerCase()] === locale),
      ),
    );
  }
  return !Object.values(value).some(filled);
}

/**
 * The Art. 13 gaps an event's addendum introduces into the notice its registrants
 * actually read.
 *
 * The addendum is checked against the *composed* notice rather than on its own,
 * because that is the document being published: an event adding `health` has
 * created an Art. 9 obligation whether or not its organization declared one,
 * and an event restating a purpose as `legitimate_interests` owes the Art. 13(1)(d)
 * explanation even though the entry it replaced needed none.
 *
 * Gaps the organization's own notice already has are subtracted rather than
 * reported. They are real, but they are not this author's to fix — an
 * organization that has published nothing yet would otherwise hand every one of
 * its events a list of failures none of them can act on.
 */
export function addendumGaps(
  organization: PrivacyNoticeContent | null,
  addendum: PrivacyNoticeAddendum,
  options: PrivacyNoticeCompletenessOptions = {},
): PrivacyNoticeGap[] {
  const inherited = new Set(
    privacyNoticeCompleteness(organization, options).gaps,
  );

  return privacyNoticeCompleteness(
    composePrivacyNotice(organization, addendum),
    options,
  ).gaps.filter((gap) => !inherited.has(gap));
}

/**
 * Whether a guided notice's law leaves naming the supervisory authority to the
 * author. A free-text notice names it in its own text.
 */
export function needsEnteredAuthority(
  content: Pick<PrivacyNoticeContent, 'framework' | 'mode'> | null | undefined,
): boolean {
  return (
    content?.mode !== 'free_text' &&
    frameworkRecord(noticeFramework(content))?.authority === 'entered'
  );
}
