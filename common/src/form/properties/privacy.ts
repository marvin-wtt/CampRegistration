import {
  PRIVACY_DATA_CATEGORY_KEYS,
  PRIVACY_PURPOSE_KEYS,
} from '../../privacy/catalogue.js';
import type { Base } from 'survey-core';
import type { PropertyDefinition } from './ProptertyDefinition.js';
import {
  REGISTRATION_PROPERTY_CATEGORY,
  REGISTRATION_PROPERTY_CATEGORY_INDEX,
} from './category.js';
import { taggedSpecialCategories } from '../privacyTags.js';

// Wire-level names, stored in saved form JSON (`Event.form`). Renaming one
// needs a data migration of every form.

/** The catalogue category a question collects (docs/privacy.md, section 5). */
export const privacyCategory: PropertyDefinition = {
  className: 'question',
  propertyInfo: {
    name: 'privacyCategory',
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
    name: 'privacyConsent:boolean',
    default: false,
    category: REGISTRATION_PROPERTY_CATEGORY,
    categoryIndex: REGISTRATION_PROPERTY_CATEGORY_INDEX,
    visibleIndex: 4,
  },
};

const isConsent = (obj: Base) =>
  obj.getPropertyValue('privacyConsent') === true;

/** What a consent is asked for; `newsletter` fills `newsletterConsent`. */
export const privacyConsentPurpose: PropertyDefinition = {
  className: 'boolean',
  propertyInfo: {
    name: 'privacyConsentPurpose:multiplevalues',
    choices: [...PRIVACY_PURPOSE_KEYS],
    dependsOn: ['privacyConsent'],
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

function selected(obj: Base): string[] {
  const value: unknown = obj.getPropertyValue('privacyConsentFor');

  return Array.isArray(value)
    ? value.filter((key): key is string => typeof key === 'string')
    : [];
}

/**
 * The special categories a consent unlocks. Separate from the purpose, so a
 * consent about something else (photos, a carpool list) gates no question.
 * Offered only while the form tags a special category, and only those.
 */
export const privacyConsentFor: PropertyDefinition = {
  className: 'boolean',
  propertyInfo: {
    name: 'privacyConsentFor:multiplevalues',
    choices: (obj: Base) => [
      ...new Set([...taggedSpecialCategories(formOf(obj)), ...selected(obj)]),
    ],
    dependsOn: ['privacyConsent'],
    visibleIf: (obj: Base) =>
      isConsent(obj) && taggedSpecialCategories(formOf(obj)).length > 0,
    category: REGISTRATION_PROPERTY_CATEGORY,
    categoryIndex: REGISTRATION_PROPERTY_CATEGORY_INDEX,
    visibleIndex: 6,
  },
};
