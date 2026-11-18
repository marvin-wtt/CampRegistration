import { SPECIAL_CATEGORY_DATA_KEYS } from '../privacy/catalogue.js';
import type { ComposedPrivacyNotice } from '../privacy/compose.js';
import {
  extractPrivacyTags,
  uncoveredConsentCategories,
} from './privacyTags.js';

/**
 * Registrations opened after this moment are held to the consent rules of
 * docs/privacy.md, section 5. Events created before it — `createdAt` before
 * it, or none at all — are left as they are and only warned about.
 */
export const PRIVACY_ENFORCED_SINCE = '2026-11-18T00:00:00.000Z';

export function isPrivacyEnforced(event: {
  createdAt?: Date | string | null;
}): boolean {
  if (!event.createdAt) {
    return false;
  }

  return new Date(event.createdAt) >= new Date(PRIVACY_ENFORCED_SINCE);
}

/**
 * The special categories that need a consent question: all of them, except
 * those the notice declares on another Art. 9 basis. A free-text notice
 * declares nothing the platform can read, so it relies on consent throughout.
 */
export function consentBasedCategories(
  notice: ComposedPrivacyNotice | null,
): Set<string> {
  const categories = new Set<string>(SPECIAL_CATEGORY_DATA_KEYS);
  if (!notice || notice.mode === 'free_text') {
    return categories;
  }

  for (const entry of notice.dataCategories) {
    if (
      entry.specialCategoryBasis &&
      entry.specialCategoryBasis !== 'explicit_consent'
    ) {
      categories.delete(entry.key);
    }
  }

  return categories;
}

/** Why a form may not take registrations, by data category. */
export interface FormPrivacyIssues {
  /** Tagged, but not declared in the notice the registrant reads. */
  undeclared: string[];
  /** Relying on consent, but no consent question covers them. */
  uncovered: string[];
}

/**
 * What stands between a form and its notice. Excluded categories are not in the
 * composed notice, so they count as undeclared. Under a free-text notice
 * nothing can be matched, so only consent coverage is checked.
 */
export function formPrivacyIssues(
  form: unknown,
  notice: ComposedPrivacyNotice | null,
): FormPrivacyIssues {
  const tags = extractPrivacyTags(form);
  const declared =
    notice?.mode === 'builder'
      ? new Set<string>(notice.dataCategories.map((entry) => entry.key))
      : null;

  return {
    undeclared: declared
      ? [
          ...new Set(
            tags.tagged
              .map((question) => question.category)
              .filter((category) => !declared.has(category)),
          ),
        ]
      : [],
    uncovered: uncoveredConsentCategories(tags, consentBasedCategories(notice)),
  };
}

export function hasPrivacyIssues(issues: FormPrivacyIssues): boolean {
  return issues.undeclared.length > 0 || issues.uncovered.length > 0;
}
