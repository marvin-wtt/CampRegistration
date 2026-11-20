import { SPECIAL_CATEGORY_DATA_KEYS } from '../privacy/catalogue.js';
import type { ComposedPrivacyNotice } from '../privacy/compose.js';
import {
  extractPrivacyTags,
  uncoveredConsentCategories,
} from './privacyTags.js';

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

export type FormPrivacyIssueKind = keyof FormPrivacyIssues;

/**
 * The issue a question tagged with `category` raises, if any. Undeclared comes
 * first: a consent cannot cover what the notice does not declare.
 */
export function privacyIssueKind(
  category: string,
  issues: FormPrivacyIssues,
): FormPrivacyIssueKind | null {
  if (issues.undeclared.includes(category)) {
    return 'undeclared';
  }
  return issues.uncovered.includes(category) ? 'uncovered' : null;
}

export function hasPrivacyIssues(issues: FormPrivacyIssues): boolean {
  return issues.undeclared.length > 0 || issues.uncovered.length > 0;
}
