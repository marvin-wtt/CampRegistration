import { PAYMENT_AMOUNT_TAG } from '@camp-registration/common/utils';

/**
 * The preset forms' adjustments to the event price, as calculated values: the
 * team takes part free of charge without a discount line in its form.
 */
export default [
  {
    name: 'payment_team_discount',
    // An empty role counts as a participant, as elsewhere in the forms.
    expression:
      "iif({role} notempty and {role} <> 'participant', 0 - {event.price}, 0)",
    eventDataType: PAYMENT_AMOUNT_TAG,
  },
];
