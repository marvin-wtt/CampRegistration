import type { Base } from 'survey-core';
import type { PrivacyDataCategoryKey } from '../privacy/catalogue.js';
import { PAYMENT_AMOUNT_TAG } from '../utils/amountDue.js';

interface EventDataTypeDefinition {
  /** Whether a question of this kind can carry the tag in the editor. */
  fits: (obj: Base) => boolean;
  /** The data category its answer suggests for the privacy notice. */
  privacyCategory?: PrivacyDataCategoryKey;
  /** No longer offered, but still read from forms tagged with it. */
  legacy?: true;
}

const ofType =
  (...types: string[]) =>
  (obj: Base) =>
    types.includes(obj.getType());

const textInput =
  (...inputTypes: string[]) =>
  (obj: Base) =>
    obj.getType() === 'text' &&
    inputTypes.includes(obj.getPropertyValue('inputType') as string);

const plainText = textInput('text');

/**
 * The `eventDataType` tags: what the platform reads off a tagged answer —
 * computed registration columns, the price, privacy suggestions. Stored in
 * saved forms, so a tag is never renamed without a data migration.
 */
export const EVENT_DATA_TYPES = {
  first_name: { fits: plainText, privacyCategory: 'identity' },
  last_name: { fits: plainText, privacyCategory: 'identity' },
  // Fills no column; kept for the privacy suggestion of forms tagged with it.
  name: { fits: plainText, privacyCategory: 'identity', legacy: true },
  email: { fits: textInput('email'), privacyCategory: 'contact' },
  phone: { fits: textInput('tel', 'text'), privacyCategory: 'contact' },
  address: { fits: ofType('address'), privacyCategory: 'address' },
  // Single address fields, for forms that build their own address questions.
  street: { fits: plainText, privacyCategory: 'address' },
  zip_code: { fits: plainText, privacyCategory: 'address' },
  city: { fits: plainText, privacyCategory: 'address' },
  country: { fits: ofType('dropdown', 'country'), privacyCategory: 'address' },
  date_of_birth: {
    fits: (obj) => ofType('date_of_birth')(obj) || textInput('date')(obj),
    privacyCategory: 'date_of_birth',
  },
  gender: {
    fits: ofType('dropdown', 'radiogroup', 'buttongroup'),
    privacyCategory: 'gender',
  },
  role: { fits: ofType('role', 'dropdown') },
  // Never a typed answer, or the registrant would set their own price
  // (docs/pricing.md).
  [PAYMENT_AMOUNT_TAG]: {
    fits: ofType(
      'expression',
      'calculatedvalue',
      'boolean',
      'radiogroup',
      'dropdown',
      'checkbox',
      'tagbox',
    ),
  },
} as const satisfies Record<string, EventDataTypeDefinition>;

export type EventDataTag = keyof typeof EVENT_DATA_TYPES;

const DEFINITIONS: Readonly<Record<EventDataTag, EventDataTypeDefinition>> =
  EVENT_DATA_TYPES;
const TAGS = Object.keys(DEFINITIONS) as EventDataTag[];

export function isEventDataTag(tag: string): tag is EventDataTag {
  // Own keys only: `toString` is no tag.
  return Object.prototype.hasOwnProperty.call(DEFINITIONS, tag);
}

/**
 * The tags the editor offers for an element. An expression can compute any
 * value, so it is offered every one.
 */
export function eventDataTagsFor(obj: Base): EventDataTag[] {
  const offered = TAGS.filter((tag) => !DEFINITIONS[tag].legacy);

  return obj.getType() === 'expression'
    ? offered
    : offered.filter((tag) => DEFINITIONS[tag].fits(obj));
}

/** The data category a tag suggests, if any. */
export function eventDataTagPrivacyCategory(
  tag: string,
): PrivacyDataCategoryKey | undefined {
  return isEventDataTag(tag) ? DEFINITIONS[tag].privacyCategory : undefined;
}
