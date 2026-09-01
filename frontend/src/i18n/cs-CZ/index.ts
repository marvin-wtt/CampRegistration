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
    internal: 'Interní chyba',
    invalidParams: 'Neplatné parametry.',
    unavailable: 'Služba je dočasně nedostupná. Zkuste to prosím později.',
    unknown: 'Služba je dočasně nedostupná.',
  },

  country: {
    de: 'Německo',
    fr: 'Francie',
    gb: 'Spojené království',
    us: 'USA',
    pl: 'Polsko',
    cz: 'Česko',
  },
};
