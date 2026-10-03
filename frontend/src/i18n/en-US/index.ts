// This is just an example,
// so you can safely delete all default props below
import stores from './stores';
import audit from './audit';
import privacy from './privacy';

export default {
  app_name: 'Inscriva',

  stores,
  audit,
  privacy,
  service: {
    internal: 'Internal error',
    invalidParams: 'Invalid parameter(s).',
    unavailable: 'Service temporarily unavailable. Please try again later.',
    unknown: 'Service temporary not available.',
    // Server error codes; anything else shows the server's message.
    errors: {
      EVENT_ALREADY_BILLED:
        'This event was already billed for its dates. To hold it again, duplicate it for the new date. If the dates were wrong, ask an administrator to void the bill first.',
      PRICE_MODEL_NOT_ACCEPTED:
        'Your organization has to accept its new prices before you can create events. An administrator of the organization can accept them on its billing page.',
      PRICE_MODEL_CHANGED:
        'The prices changed in the meantime. Please review the new prices and try again.',
      ORGANIZATION_HAS_UNPAID_BILLS:
        'The organization still has unpaid bills. They must be paid before it can be deleted.',
    },
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
