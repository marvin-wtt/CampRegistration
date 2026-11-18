import stores from './stores';
import audit from './audit';
import privacy from './privacy';
import tableTemplates from './tableTemplates';
import tasks from './tasks';
import finance from './finance';

export default {
  //app_name: '',

  stores,
  audit,
  privacy,
  tableTemplates,
  tasks,
  finance,
  service: {
    internal: 'Błąd wewnętrzny',
    invalidParams: 'Nieprawidłowe parametry.',
    notLoaded: 'Dane nie zostały jeszcze załadowane. Spróbuj ponownie.',
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
