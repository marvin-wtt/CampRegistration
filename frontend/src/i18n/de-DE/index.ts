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
    internal: 'Interner Fehler',
    invalidParams: 'Ungültige(r) Parameter.',
    unavailable:
      'Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.',
    unknown: 'Dienst vorübergehend nicht verfügbar.',
    // Server error codes; anything else shows the server's message.
    errors: {
      EVENT_ALREADY_BILLED:
        'Diese Veranstaltung wurde für ihre Termine bereits abgerechnet. Um sie erneut durchzuführen, dupliziere sie für den neuen Termin. Waren die Termine falsch, bitte einen Administrator, die Rechnung zuerst zu stornieren.',
      PRICE_MODEL_NOT_ACCEPTED:
        'Deine Organisation muss ihren neuen Preisen zustimmen, bevor du Veranstaltungen anlegen kannst. Ein Administrator der Organisation kann das auf ihrer Abrechnungsseite tun.',
      PRICE_MODEL_CHANGED:
        'Die Preise haben sich zwischenzeitlich geändert. Bitte prüfe die neuen Preise und versuche es erneut.',
      ORGANIZATION_HAS_UNPAID_BILLS:
        'Die Organisation hat noch unbezahlte Rechnungen. Sie müssen bezahlt sein, bevor sie gelöscht werden kann.',
    },
  },

  country: {
    de: 'Deutschland',
    fr: 'Frankreich',
    gb: 'Vereinigtes Königreich',
    us: 'USA',
    pl: 'Polen',
    cz: 'Tschechien',
  },
};
