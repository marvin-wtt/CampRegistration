import type { PropertyDefinition } from './PropertyDefinition.js';
import {
  REGISTRATION_PROPERTY_CATEGORY,
  REGISTRATION_PROPERTY_CATEGORY_INDEX,
} from './category.js';
import { PRICE_PROPERTY } from './accessors.js';

// Major units of the event currency, added to the amount due while selected —
// negative for a discount. Counts only on a question tagged `payment_amount`
// (`extractPaymentAmounts`); the editor shows it only there.
const name = `${PRICE_PROPERTY}:number`;

// The choices of select questions; matrix rows and columns are plain item
// values and get none.
export const choicePrice: PropertyDefinition = {
  className: 'choiceitem',
  propertyInfo: { name },
};

export const booleanPrice: PropertyDefinition = {
  className: 'boolean',
  propertyInfo: {
    name,
    category: REGISTRATION_PROPERTY_CATEGORY,
    categoryIndex: REGISTRATION_PROPERTY_CATEGORY_INDEX,
    visibleIndex: 2,
  },
};
