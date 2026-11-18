import eventDataType, { calculatedValueDataType } from './eventDataType.js';
import { showPaymentTotal } from './showPaymentTotal.js';
import { booleanPrice, choicePrice } from './price.js';
import { PropertyDefinition } from './ProptertyDefinition.js';
import { consent, consentFor, privacyCategory } from './privacy.js';

const properties: PropertyDefinition[] = [
  eventDataType,
  calculatedValueDataType,
  choicePrice,
  booleanPrice,
  showPaymentTotal,
  privacyCategory,
  consent,
  consentFor,
];

export { eventDataType, properties };

export default properties;
