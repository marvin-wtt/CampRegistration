import eventDataType from './eventDataType.js';
import { booleanPrice, choicePrice } from './price.js';
import { PropertyDefinition } from './ProptertyDefinition.js';

const properties: PropertyDefinition[] = [
  eventDataType,
  choicePrice,
  booleanPrice,
];

export { eventDataType, properties };

export default properties;
