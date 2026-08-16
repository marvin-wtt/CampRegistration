// This is just an example,
// so you can safely delete all default props below
import stores from './stores';
import privacy from './privacy';

export default {
  //app_name: '',

  stores,
  privacy,
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
    gb: 'Royaume-Uni',
    us: 'USA',
    pl: 'Pologne',
    cz: 'Tchéquie',
  },
};
