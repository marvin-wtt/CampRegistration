import stores from './stores';
import expense from './expense';

export default {
  app_name: 'Camp Registration Service',

  expense,
  stores,

  service: {
    internal: 'Erreur interne',
    invalidParams: 'Paramètre(s) invalide(s).',
    unavailable:
      'Service temporairement indisponible. Veuillez réessayer plus tard.',
    unknown: 'Service temporairement indisponible.',
  },

  country: {
    de: 'Allemagne',
    fr: 'France',
    us: 'USA',
    pl: 'Pologne',
  },
};
