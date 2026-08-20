import type { Translatable } from '../entities/Translatable.js';
import { isCustomKey, isSpecialCategory } from './catalogue.js';
import { retentionExceptions } from './compose.js';
import type { PrivacyNoticeContent } from './content.js';

/**
 * A missing Art. 13 item. One implementation, three callers: the wizard's
 * progress meter, the moderator's review card, and the server-side check that
 * refuses to verify an organization whose notice is incomplete. Splitting it
 * would let the client claim complete where the server disagrees.
 */
export type PrivacyNoticeGap =
  | 'purposes'
  | 'legitimate_interest_explanation'
  | 'custom_purpose_label'
  | 'data_categories'
  | 'special_category_basis'
  | 'custom_category_label'
  | 'recipients'
  | 'retention'
  | 'retention_exception'
  | 'transfer_countries'
  | 'transfer_safeguard'
  | 'dpo_details'
  | 'automated_details'
  | 'free_text';

/**
 * Which step of the authoring wizard a gap belongs to, so the stepper can mark
 * exactly the step that needs attention. Lives here rather than in the
 * component because the gap list is defined here — a new gap with no section
 * would otherwise fail silently in the UI.
 */
export type PrivacyNoticeSection =
  'data' | 'purposes' | 'recipients' | 'retention' | 'free_text';

export const PRIVACY_NOTICE_GAP_SECTIONS: Record<
  PrivacyNoticeGap,
  PrivacyNoticeSection
> = {
  purposes: 'purposes',
  legitimate_interest_explanation: 'purposes',
  custom_purpose_label: 'purposes',
  data_categories: 'data',
  special_category_basis: 'data',
  custom_category_label: 'data',
  recipients: 'recipients',
  retention: 'retention',
  retention_exception: 'retention',
  transfer_countries: 'retention',
  transfer_safeguard: 'retention',
  dpo_details: 'retention',
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

function isBlank(value: Translatable | null | undefined): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  const values = Object.values(value);
  return values.length === 0 || values.every((v) => v.trim().length === 0);
}

export function privacyNoticeCompleteness(
  content: PrivacyNoticeContent | null | undefined,
): PrivacyNoticeCompleteness {
  const gaps: PrivacyNoticeGap[] = [];

  if (!content) {
    return {
      complete: false,
      gaps: ['purposes', 'data_categories', 'recipients', 'retention'],
    };
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

  if (!content.retention || content.retention.months <= 0) {
    gaps.push('retention');
  }

  // An exception with no period says nothing, and one the author named himself
  // needs that name — the catalogue cannot supply it.
  if (
    retentionExceptions(content.retention).some(
      (exception) =>
        exception.months <= 0 ||
        (isCustomKey(exception.scope) && isBlank(exception.label)),
    )
  ) {
    gaps.push('retention_exception');
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
