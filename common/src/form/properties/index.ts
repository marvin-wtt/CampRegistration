import eventDataType from './eventDataType.js';
import { showPaymentTotal } from './showPaymentTotal.js';
import { booleanPrice, choicePrice } from './price.js';
import { PropertyDefinition } from './ProptertyDefinition.js';

const properties: PropertyDefinition[] = [
  eventDataType,
  choicePrice,
  booleanPrice,
  showPaymentTotal,
];

export { eventDataType, properties };

export default properties;
