import { PAYMENT_AMOUNT_TAG } from '@camp-registration/common/utils';

/**
 * The preset forms' adjustments to the event price. Each counts while it is
 * shown, so a discount is one question with a `visibleIf`.
 */
export default [
  {
    type: 'expression',
    name: 'payment_team_discount',
    // An empty role counts as a participant, as elsewhere in the forms.
    visibleIf: "{role} notempty and {role} <> 'participant'",
    title: {
      en: 'Team discount',
      de: 'Teamrabatt',
      fr: "Réduction pour l'équipe",
      pl: 'Zniżka dla zespołu',
      cs: 'Sleva pro tým',
      default: 'Team discount',
    },
    description: {
      en: 'The team takes part free of charge.',
      de: 'Das Team nimmt kostenlos teil.',
      fr: "L'équipe participe gratuitement.",
      pl: 'Zespół uczestniczy bezpłatnie.',
      cs: 'Tým se účastní zdarma.',
      default: 'The team takes part free of charge.',
    },
    expression: '0 - {event.price}',
    eventDataType: PAYMENT_AMOUNT_TAG,
  },
];
