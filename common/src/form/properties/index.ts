import eventDataType, { calculatedValueDataType } from './eventDataType.js';
import { showPaymentTotal } from './showPaymentTotal.js';
import { booleanPrice, choicePrice } from './price.js';
import { PropertyDefinition } from './ProptertyDefinition.js';
import {
  privacyConsent,
  privacyConsentFor,
  privacyConsentPurpose,
  privacyCategory,
} from './privacy.js';

const properties: PropertyDefinition[] = [
  eventDataType,
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
