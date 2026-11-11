// This is just an example,
// so you can safely delete all default props below
import stores from './stores';
import audit from './audit';
import privacy from './privacy';
import tableTemplates from './tableTemplates';
import tasks from './tasks';

export default {
  app_name: 'Inscriva',

  stores,
  audit,
  privacy,
  tableTemplates,
  tasks,
  service: {
    internal: 'Internal error',
    invalidParams: 'Invalid parameter(s).',
    notLoaded: 'The data is not loaded yet. Please try again.',
    unavailable: 'Service temporarily unavailable. Please try again later.',
    unknown: 'Service temporary not available.',
  },

  country: {
    de: 'Germany',
    gb: 'United Kingdom',
    fr: 'France',
    us: 'USA',
    pl: 'Poland',
    cz: 'Czechia',
  },
};
