import type {
  EventDetails,
  Registration,
  TableColumnTemplate,
  TableTemplate,
} from '@camp-registration/common/entities';
import type { useRegistrationHelper } from '@/composables/registrationHelper';

/**
 * Hidden, frontend-only table templates.
 *
 * These are never persisted and never shown in the template picker. They exist
 * so the dashboard "needs attention" items can deep-link into the participants
 * table with a meaningful, pre-filtered view via the `?template=` query param,
 * e.g. `…/participants?template=attention-pending`.
 */
export interface LocalTableTemplate extends TableTemplate {
  hidden: true;
  localFilter?: (registration: Registration) => boolean;
}

export const LOCAL_TEMPLATE_PENDING = 'attention-pending';
export const LOCAL_TEMPLATE_MISSING = 'attention-missing';
export const LOCAL_TEMPLATE_AGE = 'attention-age';
export const LOCAL_TEMPLATE_PAYMENTS = 'payments';
export const LOCAL_TEMPLATE_PAYMENTS_OPEN = 'payments-open';
export const LOCAL_TEMPLATE_PAYMENTS_OVERPAID = 'payments-overpaid';

/** Has a fee at all. */
export function hasFee(registration: Registration): boolean {
  return registration.payment.status !== 'NOT_REQUIRED';
}

/**
 * Accepted with a fee — the `payments` table and the dashboard's counts.
 * Pending and waitlisted registrations are not asked to pay.
 */
export function owesFee(registration: Registration): boolean {
  return registration.status === 'ACCEPTED' && hasFee(registration);
}

/**
 * Accepted but not paid in full. Pending and waitlisted registrations may
 * still be turned down, so they don't count as owing yet.
 */
export function paymentOpen(registration: Registration): boolean {
  const { status } = registration.payment;
  return (
    registration.status === 'ACCEPTED' &&
    (status === 'UNPAID' || status === 'PARTIAL')
  );
}

/** Paid more than is due, whatever the registration's status: to refund. */
export function paymentOverpaid(registration: Registration): boolean {
  return registration.payment.status === 'OVERPAID';
}

type RegistrationHelper = ReturnType<typeof useRegistrationHelper>;

const NAME_COLUMNS: TableColumnTemplate[] = [
  {
    name: 'first_name',
    field: 'computedData.firstName',
    label: {
      en: 'First Name',
      de: 'Vorname',
      fr: 'Prénom',
      cs: 'Jméno',
      pl: 'Imię',
    },
    align: 'left',
    sortable: true,
    renderAs: 'name',
  },
  {
    name: 'last_name',
    field: 'computedData.lastName',
    label: {
      en: 'Last Name',
      de: 'Nachname',
      fr: 'Nom',
      cs: 'Příjmení',
      pl: 'Nazwisko',
    },
    align: 'left',
    sortable: true,
    renderAs: 'name',
  },
];

const GROUP_COLUMN: TableColumnTemplate = {
  name: 'group',
  field: 'group',
  source: 'meta',
  label: {
    en: 'Group',
    de: 'Gruppe',
    fr: 'Groupe',
    cs: 'Skupina',
    pl: 'Grupa',
  },
  align: 'left',
  sortable: true,
  renderAs: 'country_flag',
};

const EMAIL_COLUMN: TableColumnTemplate = {
  name: 'email',
  field: 'computedData.emails',
  label: {
    en: 'E-Mail',
    de: 'E-Mail',
    fr: 'E-Mail',
    cs: 'E-Mail',
    pl: 'E-Mail',
  },
  align: 'left',
  sortable: false,
  renderAs: 'email',
  isArray: true,
};

const AGE_COLUMN: TableColumnTemplate = {
  name: 'age',
  field: 'computedData.dateOfBirth',
  label: { en: 'Age', de: 'Alter', fr: 'Âge', cs: 'Věk', pl: 'Wiek' },
  align: 'left',
  sortable: true,
  renderAs: 'age',
};

const STATUS_COLUMN: TableColumnTemplate = {
  name: 'status',
  field: 'status',
  label: { en: 'Status', de: 'Status', fr: 'Statut', cs: 'Stav', pl: 'Status' },
  align: 'left',
  sortable: true,
  renderAs: 'status',
};

const PAYMENT_STATUS_COLUMN: TableColumnTemplate = {
  name: 'payment_status',
  field: 'payment.status',
  label: {
    en: 'Payment',
    de: 'Zahlung',
    fr: 'Paiement',
    cs: 'Platba',
    pl: 'Płatność',
  },
  align: 'left',
  sortable: true,
  renderAs: 'payment_status',
};

// Minor units of the event currency, right-aligned so amounts line up.
const moneyColumn = (
  name: string,
  field: string,
  label: TableColumnTemplate['label'],
): TableColumnTemplate => ({
  name,
  field,
  label,
  align: 'right',
  sortable: true,
  renderAs: 'money',
});

const AMOUNT_DUE_COLUMN = moneyColumn('amount_due', 'payment.amountDue', {
  en: 'Due',
  de: 'Fällig',
  fr: 'Dû',
  cs: 'Dlužno',
  pl: 'Należne',
});

const AMOUNT_PAID_COLUMN = moneyColumn('amount_paid', 'payment.amountPaid', {
  en: 'Paid',
  de: 'Bezahlt',
  fr: 'Payé',
  cs: 'Zaplaceno',
  pl: 'Zapłacono',
});

const AMOUNT_COLUMNS: TableColumnTemplate[] = [
  AMOUNT_DUE_COLUMN,
  AMOUNT_PAID_COLUMN,
  moneyColumn('outstanding', 'payment.outstanding', {
    en: 'Open',
    de: 'Offen',
    fr: 'À payer',
    cs: 'Nezaplaceno',
    pl: 'Do zapłaty',
  }),
];

const REQUESTED_COLUMN: TableColumnTemplate = {
  name: 'requested_at',
  field: 'payment.requestedAt',
  label: {
    en: 'Asked to pay',
    de: 'Aufgefordert',
    fr: 'Demande envoyée',
    cs: 'Vyzváno',
    pl: 'Wezwano',
  },
  align: 'left',
  sortable: true,
  renderAs: 'time_ago',
};

const REGISTERED_COLUMN: TableColumnTemplate = {
  name: 'created_at',
  field: 'createdAt',
  label: {
    en: 'Registered',
    de: 'Angemeldet',
    fr: 'Inscrit',
    cs: 'Registrováno',
    pl: 'Zarejestrowano',
  },
  align: 'left',
  sortable: true,
  renderAs: 'time_ago',
};

/**
 * Builds the hidden local templates for the current event. The helper and event
 * are captured so predicates can reuse the exact same logic the dashboard uses
 * to compute its attention counts, keeping the badge counts and the resulting
 * table in sync.
 */
export function buildLocalTableTemplates(
  helper: RegistrationHelper,
  event: EventDetails,
): LocalTableTemplate[] {
  const isParticipant = (registration: Registration): boolean =>
    helper.participant(registration);

  return [
    {
      id: LOCAL_TEMPLATE_PENDING,
      title: {
        en: 'Pending confirmations',
        de: 'Ausstehende Bestätigungen',
        fr: 'Confirmations en attente',
        cs: 'Čekající potvrzení',
        pl: 'Oczekujące potwierdzenia',
      },
      hidden: true,
      generated: true,
      order: 900,
      indexed: true,
      actions: true,
      filterStatus: ['PENDING'],
      sortBy: 'created_at',
      sortDirection: 'asc',
      localFilter: isParticipant,
      columns: [
        ...NAME_COLUMNS,
        GROUP_COLUMN,
        REGISTERED_COLUMN,
        STATUS_COLUMN,
      ],
    },
    {
      id: LOCAL_TEMPLATE_MISSING,
      title: {
        en: 'Missing contact details',
        de: 'Fehlende Kontaktdaten',
        fr: 'Coordonnées manquantes',
        cs: 'Chybějící kontaktní údaje',
        pl: 'Brakujące dane kontaktowe',
      },
      hidden: true,
      generated: true,
      order: 901,
      indexed: true,
      actions: true,
      sortBy: 'last_name',
      localFilter: (registration) =>
        isParticipant(registration) &&
        (!helper.email(registration) || !helper.fullName(registration)),
      columns: [...NAME_COLUMNS, EMAIL_COLUMN, GROUP_COLUMN, STATUS_COLUMN],
    },
    {
      id: LOCAL_TEMPLATE_AGE,
      title: {
        en: 'Age outside event range',
        de: 'Alter außerhalb des Bereichs',
        fr: 'Âge hors de la plage',
        cs: 'Věk mimo rozsah',
        pl: 'Wiek poza zakresem',
      },
      hidden: true,
      generated: true,
      order: 902,
      indexed: true,
      actions: true,
      sortBy: 'age',
      localFilter: (registration) => {
        if (!isParticipant(registration)) {
          return false;
        }
        const age = helper.age(registration);
        if (age == null) {
          return false;
        }
        return age < event.minAge || age > event.maxAge;
      },
      columns: [...NAME_COLUMNS, AGE_COLUMN, GROUP_COLUMN, STATUS_COLUMN],
    },
    {
      id: LOCAL_TEMPLATE_PAYMENTS_OPEN,
      title: {
        en: 'Not paid in full',
        de: 'Nicht vollständig bezahlt',
        fr: 'Pas entièrement payé',
        cs: 'Nezaplaceno v plné výši',
        pl: 'Nie w pełni opłacone',
      },
      hidden: true,
      generated: true,
      order: 903,
      indexed: true,
      actions: true,
      // Largest open amount first: who to chase.
      sortBy: 'outstanding',
      sortDirection: 'desc',
      localFilter: paymentOpen,
      columns: [
        ...NAME_COLUMNS,
        GROUP_COLUMN,
        PAYMENT_STATUS_COLUMN,
        ...AMOUNT_COLUMNS,
        REQUESTED_COLUMN,
        EMAIL_COLUMN,
      ],
    },
    {
      id: LOCAL_TEMPLATE_PAYMENTS_OVERPAID,
      title: {
        en: 'Overpaid',
        de: 'Überzahlt',
        fr: 'Trop-perçus',
        cs: 'Přeplaceno',
        pl: 'Nadpłacone',
      },
      hidden: true,
      generated: true,
      order: 905,
      indexed: true,
      actions: true,
      sortBy: 'overpaid',
      sortDirection: 'desc',
      localFilter: paymentOverpaid,
      columns: [
        ...NAME_COLUMNS,
        GROUP_COLUMN,
        STATUS_COLUMN,
        PAYMENT_STATUS_COLUMN,
        AMOUNT_DUE_COLUMN,
        AMOUNT_PAID_COLUMN,
        moneyColumn('overpaid', 'payment.overpaid', {
          en: 'Overpaid',
          de: 'Überzahlt',
          fr: 'Trop-perçu',
          cs: 'Přeplaceno',
          pl: 'Nadpłata',
        }),
        EMAIL_COLUMN,
      ],
    },
    {
      id: LOCAL_TEMPLATE_PAYMENTS,
      title: {
        en: 'Payments',
        de: 'Zahlungen',
        fr: 'Paiements',
        cs: 'Platby',
        pl: 'Płatności',
      },
      hidden: true,
      generated: true,
      order: 904,
      indexed: true,
      actions: true,
      sortBy: 'last_name',
      localFilter: owesFee,
      columns: [
        ...NAME_COLUMNS,
        GROUP_COLUMN,
        STATUS_COLUMN,
        PAYMENT_STATUS_COLUMN,
        ...AMOUNT_COLUMNS,
      ],
    },
  ];
}
