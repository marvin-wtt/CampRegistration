import {
  PRIVACY_DATA_CATEGORY_KEYS,
  PRIVACY_PURPOSE_KEYS,
} from '../../privacy/catalogue.js';
import type { Base } from 'survey-core';
import type { PropertyDefinition } from './PropertyDefinition.js';
import {
  REGISTRATION_PROPERTY_CATEGORY,
  REGISTRATION_PROPERTY_CATEGORY_INDEX,
} from './category.js';
import {
  consentCategoriesOf,
  isConsent,
  PRIVACY_CATEGORY_PROPERTY,
  PRIVACY_CONSENT_FOR_PROPERTY,
  PRIVACY_CONSENT_PROPERTY,
  PRIVACY_CONSENT_PURPOSE_PROPERTY,
} from './accessors.js';
import { taggedSpecialCategories } from '../privacyTags.js';

/** The catalogue category a question collects (docs/privacy.md, section 5). */
export const privacyCategory: PropertyDefinition = {
  className: 'question',
  propertyInfo: {
    name: PRIVACY_CATEGORY_PROPERTY,
    type: 'dropdown',
    choices: [...PRIVACY_DATA_CATEGORY_KEYS],
    category: REGISTRATION_PROPERTY_CATEGORY,
    categoryIndex: REGISTRATION_PROPERTY_CATEGORY_INDEX,
    visibleIndex: 3,
  },
};

/** Marks a boolean as a consent, whose wording is kept as proof. */
export const privacyConsent: PropertyDefinition = {
  className: 'boolean',
  propertyInfo: {
    name: `${PRIVACY_CONSENT_PROPERTY}:boolean`,
    default: false,
    category: REGISTRATION_PROPERTY_CATEGORY,
    categoryIndex: REGISTRATION_PROPERTY_CATEGORY_INDEX,
    visibleIndex: 4,
  },
};

/** What a consent is asked for; `newsletter` fills `newsletterConsent`. */
export const privacyConsentPurpose: PropertyDefinition = {
  className: 'boolean',
  propertyInfo: {
    name: `${PRIVACY_CONSENT_PURPOSE_PROPERTY}:multiplevalues`,
    choices: [...PRIVACY_PURPOSE_KEYS],
    dependsOn: [PRIVACY_CONSENT_PROPERTY],
    visibleIf: isConsent,
    category: REGISTRATION_PROPERTY_CATEGORY,
    categoryIndex: REGISTRATION_PROPERTY_CATEGORY_INDEX,
    visibleIndex: 5,
  },
};

// The form the question sits in, as saved. Only the editor asks.
function formOf(obj: Base): unknown {
  const survey = obj.getSurvey() as { toJSON?: () => unknown } | null;

  return typeof survey?.toJSON === 'function' ? survey.toJSON() : null;
}

/**
 * The special categories a consent unlocks. Separate from the purpose, so a
 * consent about something else (photos, a carpool list) gates no question.
 * Offered only while the form tags a special category, and only those.
 */
export const privacyConsentFor: PropertyDefinition = {
  className: 'boolean',
  propertyInfo: {
    name: `${PRIVACY_CONSENT_FOR_PROPERTY}:multiplevalues`,
    choices: (obj: Base) => [
      ...new Set([
        ...taggedSpecialCategories(formOf(obj)),
        ...consentCategoriesOf(obj),
      ]),
    ],
    dependsOn: [PRIVACY_CONSENT_PROPERTY],
    visibleIf: (obj: Base) =>
      isConsent(obj) && taggedSpecialCategories(formOf(obj)).length > 0,
    category: REGISTRATION_PROPERTY_CATEGORY,
    categoryIndex: REGISTRATION_PROPERTY_CATEGORY_INDEX,
    visibleIndex: 6,
  },
};
