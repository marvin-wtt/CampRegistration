import stores from './stores';
import expense from './expense';

export default {
  app_name: 'Camp Registration Service',

  expense,
  stores,

  service: {
    internal: 'Interner Fehler',
    invalidParams: 'Ungültige(r) Parameter.',
    unavailable:
      'Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.',
    unknown: 'Dienst vorübergehend nicht verfügbar.',
  },

  country: {
    de: 'Deutschland',
    fr: 'Frankreich',
    us: 'USA',
    pl: 'Polen',
  },
};
