import type {
  CampDetails,
  Registration,
  TableColumnTemplate,
  TableTemplate,
} from '@camp-registration/common/entities';
import type { useRegistrationHelper } from 'src/composables/registrationHelper';

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

const COUNTRY_COLUMN: TableColumnTemplate = {
  name: 'country',
  field: 'computedData.address.country',
  label: { en: 'Country', de: 'Land', fr: 'Pays', cs: 'Země', pl: 'Kraj' },
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
 * Builds the hidden local templates for the current camp. The helper and camp
 * are captured so predicates can reuse the exact same logic the dashboard uses
 * to compute its attention counts, keeping the badge counts and the resulting
 * table in sync.
 */
export function buildLocalTableTemplates(
  helper: RegistrationHelper,
  camp: CampDetails,
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
        COUNTRY_COLUMN,
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
      columns: [...NAME_COLUMNS, EMAIL_COLUMN, COUNTRY_COLUMN, STATUS_COLUMN],
    },
    {
      id: LOCAL_TEMPLATE_AGE,
      title: {
        en: 'Age outside camp range',
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
        return age < camp.minAge || age > camp.maxAge;
      },
      columns: [...NAME_COLUMNS, AGE_COLUMN, COUNTRY_COLUMN, STATUS_COLUMN],
    },
  ];
}
