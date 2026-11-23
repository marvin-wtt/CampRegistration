import { calculatedValueDataType, questionDataType } from './eventDataType.js';
import { showPaymentTotal } from './showPaymentTotal.js';
import { booleanPrice, choicePrice } from './price.js';
import type { PropertyDefinition } from './PropertyDefinition.js';
import {
  privacyConsent,
  privacyConsentFor,
  privacyConsentPurpose,
  privacyCategory,
} from './privacy.js';

const properties: PropertyDefinition[] = [
  questionDataType,
  calculatedValueDataType,
  choicePrice,
  booleanPrice,
  showPaymentTotal,
  privacyCategory,
  privacyConsent,
  privacyConsentPurpose,
  privacyConsentFor,
];

export default properties;
