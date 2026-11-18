import {
  PRIVACY_DATA_CATEGORY_KEYS,
  SPECIAL_CATEGORY_DATA_KEYS,
} from '../../privacy/catalogue.js';
import type { Base } from 'survey-core';
import type { PropertyDefinition } from './ProptertyDefinition.js';

// Wire-level names, stored in saved form JSON (`Event.form`). Renaming one
// needs a data migration of every form.

/** The catalogue category a question collects (docs/privacy.md, section 5). */
export const privacyCategory: PropertyDefinition = {
  className: 'question',
  propertyInfo: {
    name: 'privacyCategory',
    type: 'dropdown',
    choices: [...PRIVACY_DATA_CATEGORY_KEYS],
    category: 'general',
    visibleIndex: 4,
  },
};

/** Marks a boolean as a consent, whose wording is kept as proof. */
export const consent: PropertyDefinition = {
  className: 'boolean',
  propertyInfo: {
    name: 'consent:boolean',
    default: false,
    category: 'general',
    visibleIndex: 5,
  },
};

/**
 * The special categories a consent unlocks. Separate from `consent`, so a
 * consent about something else (photos, a carpool list) gates no question.
 */
export const consentFor: PropertyDefinition = {
  className: 'boolean',
  propertyInfo: {
    name: 'consentFor:multiplevalues',
    choices: [...SPECIAL_CATEGORY_DATA_KEYS],
    dependsOn: ['consent'],
    visibleIf: (obj: Base) => obj.getPropertyValue('consent') === true,
    category: 'general',
    visibleIndex: 6,
  },
};
