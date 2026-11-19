import {
  PRIVACY_DATA_CATEGORY_KEYS,
  SPECIAL_CATEGORY_DATA_KEYS,
} from '../../privacy/catalogue.js';
import type { Base } from 'survey-core';
import type { PropertyDefinition } from './ProptertyDefinition.js';
import {
  REGISTRATION_PROPERTY_CATEGORY,
  REGISTRATION_PROPERTY_CATEGORY_INDEX,
} from './category.js';

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

/**
 * The special categories a consent unlocks. Separate from `consent`, so a
 * consent about something else (photos, a carpool list) gates no question.
 */
export const privacyConsentFor: PropertyDefinition = {
  className: 'boolean',
  propertyInfo: {
    name: 'privacyConsentFor:multiplevalues',
    choices: [...SPECIAL_CATEGORY_DATA_KEYS],
    dependsOn: ['privacyConsent'],
    visibleIf: (obj: Base) => obj.getPropertyValue('privacyConsent') === true,
    category: REGISTRATION_PROPERTY_CATEGORY,
    categoryIndex: REGISTRATION_PROPERTY_CATEGORY_INDEX,
    visibleIndex: 5,
  },
};
