import stores from './stores';
import audit from './audit';
import privacy from './privacy';

export default {
  //app_name: '',

  stores,
  audit,
  privacy,
  service: {
    internal: 'Błąd wewnętrzny',
    invalidParams: 'Nieprawidłowe parametry.',
    unavailable: 'Usługa tymczasowo niedostępna. Spróbuj ponownie później.',
    unknown: 'Usługa tymczasowo niedostępna.',
    // Server error codes; anything else shows the server's message.
    errors: {
      EVENT_ALREADY_BILLED:
        'To wydarzenie zostało już rozliczone za swoje terminy. Aby zorganizować je ponownie, zduplikuj je na nowy termin. Jeśli terminy były błędne, poproś najpierw administratora o anulowanie rachunku.',
      EVENT_DATES_OUT_OF_RANGE:
        'Wydarzenia nie można przenieść tak, aby zakończyło się ponad 30 dni temu.',
      PRICE_MODEL_NOT_ACCEPTED:
        'Twoja organizacja musi zaakceptować nowe ceny, zanim będziesz mógł tworzyć wydarzenia. Administrator organizacji może je zaakceptować na stronie rozliczeń.',
      PRICE_MODEL_CHANGED:
        'Ceny zmieniły się w międzyczasie. Sprawdź nowe ceny i spróbuj ponownie.',
      ORGANIZATION_HAS_UNPAID_BILLS:
        'Organizacja ma jeszcze nieopłacone rachunki. Muszą zostać opłacone, zanim będzie można ją usunąć.',
    },
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
