// This is just an example,
// so you can safely delete all default props below
import stores from './stores';

export default {
  app_name: 'Camp Registration Service',

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
    cz: 'Tchéquie',
  },
};
