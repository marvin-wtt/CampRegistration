// This is just an example,
// so you can safely delete all default props below
import stores from './stores';
import audit from './audit';
import privacy from './privacy';

export default {
  //app_name: '',

  stores,
  audit,
  privacy,
  service: {
    internal: 'Erreur interne',
    invalidParams: 'Paramètre(s) invalide(s).',
    unavailable:
      'Service temporairement indisponible. Veuillez réessayer plus tard.',
    unknown: 'Service temporairement indisponible.',
    // Server error codes; anything else shows the server's message.
    errors: {
      EVENT_ALREADY_BILLED:
        "Cet événement a déjà été facturé pour ses dates. Pour l'organiser à nouveau, duplique-le pour la nouvelle date. Si les dates étaient erronées, demande d'abord à un administrateur d'annuler la facture.",
      PRICE_MODEL_NOT_ACCEPTED:
        "Ton organisation doit accepter ses nouveaux tarifs avant que tu puisses créer des événements. Un administrateur de l'organisation peut les accepter sur sa page de facturation.",
      PRICE_MODEL_CHANGED:
        'Les tarifs ont changé entre-temps. Vérifie les nouveaux tarifs et réessaie.',
      ORGANIZATION_HAS_UNPAID_BILLS:
        "L'organisation a encore des factures impayées. Elles doivent être payées avant qu'elle puisse être supprimée.",
    },
  },

  country: {
    de: 'Allemagne',
    fr: 'France',
    gb: 'Royaume-Uni',
    us: 'USA',
    pl: 'Pologne',
    cz: 'Tchéquie',
  },
};
