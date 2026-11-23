import type { Base } from 'survey-core';
import { PAYMENT_AMOUNT_TAG } from '../../utils/amountDue.js';

// Wire-level names of the platform's own properties, stored in saved form JSON
// (`Event.form`). Renaming one needs a data migration of every form.
export const EVENT_DATA_TYPE_PROPERTY = 'eventDataType';
export const PRICE_PROPERTY = 'price';
export const PRIVACY_CATEGORY_PROPERTY = 'privacyCategory';
export const PRIVACY_CONSENT_PROPERTY = 'privacyConsent';
export const PRIVACY_CONSENT_PURPOSE_PROPERTY = 'privacyConsentPurpose';
export const PRIVACY_CONSENT_FOR_PROPERTY = 'privacyConsentFor';

function stringOf(obj: Base, name: string): string | undefined {
  const value: unknown = obj.getPropertyValue(name);
  return typeof value === 'string' && value ? value : undefined;
}

function stringsOf(obj: Base, name: string): string[] {
  const value: unknown = obj.getPropertyValue(name);
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

export function eventDataTypeOf(obj: Base): string | undefined {
  return stringOf(obj, EVENT_DATA_TYPE_PROPERTY);
}

/** Whether the element's answer adjusts the price (docs/pricing.md). */
export function isPriced(obj: Base): boolean {
  return eventDataTypeOf(obj) === PAYMENT_AMOUNT_TAG;
}

export function priceOf(obj: Base): unknown {
  return obj.getPropertyValue(PRICE_PROPERTY);
}

export function privacyCategoryOf(obj: Base): string | undefined {
  return stringOf(obj, PRIVACY_CATEGORY_PROPERTY);
}

/** A boolean marked as a consent, whose wording is kept as proof. */
export function isConsent(obj: Base): boolean {
  return (
    obj.getType() === 'boolean' &&
    obj.getPropertyValue(PRIVACY_CONSENT_PROPERTY) === true
  );
}

/** The special categories a consent unlocks. */
export function consentCategoriesOf(obj: Base): string[] {
  return stringsOf(obj, PRIVACY_CONSENT_FOR_PROPERTY);
}

/** The catalogue purposes a consent is asked for, such as `newsletter`. */
export function consentPurposesOf(obj: Base): string[] {
  return stringsOf(obj, PRIVACY_CONSENT_PURPOSE_PROPERTY);
}
