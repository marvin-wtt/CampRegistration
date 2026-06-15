import stores from './stores';

export default {
  //app_name: '',

  stores,

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
