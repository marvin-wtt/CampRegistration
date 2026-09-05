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
    internal: 'Interner Fehler',
    invalidParams: 'Ungültige(r) Parameter.',
    unavailable:
      'Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.',
    unknown: 'Dienst vorübergehend nicht verfügbar.',
  },

  country: {
    de: 'Deutschland',
    fr: 'Frankreich',
    gb: 'Vereinigtes Königreich',
    us: 'USA',
    pl: 'Polen',
    cz: 'Tschechien',
  },
};
