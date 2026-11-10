import stores from './stores';
import audit from './audit';
import privacy from './privacy';
import tableTemplates from './tableTemplates';

export default {
  //app_name: '',

  stores,
  audit,
  privacy,
  tableTemplates,
  service: {
    internal: 'Błąd wewnętrzny',
    invalidParams: 'Nieprawidłowe parametry.',
    unavailable: 'Usługa tymczasowo niedostępna. Spróbuj ponownie później.',
    unknown: 'Usługa tymczasowo niedostępna.',
  },

  country: {
    de: 'Niemcy',
    fr: 'Francja',
    gb: 'Wielka Brytania',
    us: 'USA',
    pl: 'Polska',
    cz: 'Czechy',
  },
};
