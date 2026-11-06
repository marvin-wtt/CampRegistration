import type { PropertyDefinition } from './ProptertyDefinition.js';

// Major units of the event currency, added to the amount due while selected —
// negative for a discount. Read by `extractPaymentAmounts`.
const name = 'price:number';

// The choices of select questions; matrix rows and columns are plain item
// values and get none.
export const choicePrice: PropertyDefinition = {
  className: 'choiceitem',
  propertyInfo: { name },
};

export const booleanPrice: PropertyDefinition = {
  className: 'boolean',
  propertyInfo: { name, category: 'general', visibleIndex: 4 },
};
