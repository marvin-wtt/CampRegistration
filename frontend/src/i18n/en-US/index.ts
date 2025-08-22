import stores from './stores';
import expense from './expense';

export default {
  app_name: 'Camp Registration Service',

  expense,
  stores,

  service: {
    internal: 'Internal error',
    invalidParams: 'Invalid parameter(s).',
    unavailable: 'Service temporarily unavailable. Please try again later.',
    unknown: 'Service temporary not available.',
  },

  country: {
    de: 'Germany',
    fr: 'France',
    us: 'USA',
    pl: 'Poland',
  },
};
