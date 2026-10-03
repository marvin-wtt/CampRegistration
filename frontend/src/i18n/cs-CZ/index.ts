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
    // Server error codes; anything else shows the server's message.
    errors: {
      EVENT_ALREADY_BILLED:
        'Tato akce už byla za své termíny vyúčtována. Chceš-li ji pořádat znovu, zduplikuj ji na nový termín. Pokud byly termíny chybné, požádej nejprve správce o stornování faktury.',
      PRICE_MODEL_NOT_ACCEPTED:
        'Tvá organizace musí přijmout nové ceny, než budeš moci vytvářet akce. Správce organizace je může přijmout na její stránce vyúčtování.',
      PRICE_MODEL_CHANGED:
        'Ceny se mezitím změnily. Zkontroluj prosím nové ceny a zkus to znovu.',
      ORGANIZATION_HAS_UNPAID_BILLS:
        'Organizace má ještě nezaplacené faktury. Musí být zaplaceny, než ji bude možné smazat.',
    },
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
