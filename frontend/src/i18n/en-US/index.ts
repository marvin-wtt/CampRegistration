// This is just an example,
// so you can safely delete all default props below
import stores from './stores';

export default {
  app_name: 'Inscriva',

  stores,

  service: {
    internal: 'Internal error',
    invalidParams: 'Invalid parameter(s).',
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
