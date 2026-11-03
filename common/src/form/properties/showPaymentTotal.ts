import type { PropertyDefinition } from './ProptertyDefinition.js';

export const PAYMENT_TOTAL_MODES = ['nonZero', 'always', 'never'] as const;
export type PaymentTotalMode = (typeof PAYMENT_TOTAL_MODES)[number];

// When the registration form shows the amount due on its last page. The
// default is never serialized, so existing forms keep their behaviour.
export const showPaymentTotal: PropertyDefinition = {
  className: 'survey',
  propertyInfo: {
    name: 'showPaymentTotal',
    default: 'nonZero',
    choices: [...PAYMENT_TOTAL_MODES],
    category: 'payment',
  },
};
