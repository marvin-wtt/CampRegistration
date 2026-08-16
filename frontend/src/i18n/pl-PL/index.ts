import stores from './stores';
import privacy from './privacy';

export default {
  //app_name: '',

  stores,
  privacy,
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
