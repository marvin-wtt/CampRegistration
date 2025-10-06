// This is just an example,
// so you can safely delete all default props below
import stores from './stores';

export default {
  app_name: 'Služba registrace táborů',

  stores,

  service: {
    internal: 'Interní chyba',
    invalidParams: 'Neplatné parametry.',
    unavailable: 'Služba je dočasně nedostupná. Zkuste to prosím později.',
    unknown: 'Služba je dočasně nedostupná.',
  },

  country: {
    de: 'Německo',
    fr: 'Francie',
    us: 'USA',
    pl: 'Polsko',
  },
};
