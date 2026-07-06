import { BaseSeeder } from './BaseSeeder';
import { TableTemplateFactory } from '../factories';

class TableTemplateSeeder extends BaseSeeder {
  name(): string {
    return 'table-template';
  }

  async run(): Promise<void> {
    await TableTemplateFactory.create({
      data: {
        title: 'Test',
        columns: [
          {
            name: 'first_name',
            field: 'computedData.firstName',
            label: { en: 'First Name', de: 'Vorname', fr: 'Prénom' },
            align: 'left',
            sortable: true,
            renderAs: 'name',
          },
          {
            name: 'last_name',
            field: 'computedData.lastName',
            label: { en: 'Last Name', de: 'Nachname', fr: 'Nom de famille' },
            align: 'left',
            sortable: true,
            renderAs: 'name',
          },
        ],
        order: 0,
        filterStatus: ['ACCEPTED'],
        indexed: true,
        actions: true,
        sortBy: 'first_name',
      },
      camp: { connect: { id: '01JHP0CXJFR4MQS8SF1HQJCY38' } },
    });

    // Summer camp – Participants
    await TableTemplateFactory.create({
      data: {
        title: { en: 'Participants', de: 'Teilnehmer', fr: 'Participants' },
        columns: [
          {
            name: 'first_name',
            field: 'computedData.firstName',
            label: { en: 'First Name', de: 'Vorname', fr: 'Prénom' },
            align: 'left',
            sortable: true,
            renderAs: 'name',
          },
          {
            name: 'last_name',
            field: 'computedData.lastName',
            label: { en: 'Last Name', de: 'Nachname', fr: 'Nom de famille' },
            align: 'left',
            sortable: true,
            renderAs: 'name',
          },
          {
            name: 'country',
            field: 'country',
            label: { en: 'Country', de: 'Land', fr: 'Pays' },
            align: 'left',
            sortable: true,
            renderAs: 'country_flag',
          },
          {
            name: 'gender',
            field: 'computedData.gender',
            label: { en: 'Gender', de: 'Geschlecht', fr: 'Sexe' },
            align: 'left',
            sortable: true,
            renderAs: 'gender',
          },
          {
            name: 'date_of_birth',
            field: 'computedData.dateOfBirth',
            label: { en: 'Age', de: 'Alter', fr: 'Âge' },
            align: 'left',
            sortable: true,
            renderAs: 'age',
          },
          {
            name: 'email',
            field: 'data.email',
            label: { en: 'E-Mail', de: 'E-Mail', fr: 'E-Mail' },
            align: 'left',
            sortable: false,
            renderAs: 'email',
          },
        ],
        order: 0,
        filterStatus: ['ACCEPTED'],
        indexed: true,
        actions: true,
        sortBy: 'first_name',
      },
      camp: { connect: { id: '01K9ATF1H9KD1K6H12F3YK8RWR' } },
    });

    // Summer camp – Waiting List
    await TableTemplateFactory.create({
      data: {
        title: { en: 'Waiting List', de: 'Warteliste', fr: "Liste d'attente" },
        columns: [
          {
            name: 'first_name',
            field: 'computedData.firstName',
            label: { en: 'First Name', de: 'Vorname', fr: 'Prénom' },
            align: 'left',
            sortable: true,
            renderAs: 'name',
          },
          {
            name: 'last_name',
            field: 'computedData.lastName',
            label: { en: 'Last Name', de: 'Nachname', fr: 'Nom de famille' },
            align: 'left',
            sortable: true,
            renderAs: 'name',
          },
          {
            name: 'country',
            field: 'country',
            label: { en: 'Country', de: 'Land', fr: 'Pays' },
            align: 'left',
            sortable: true,
            renderAs: 'country_flag',
          },
          {
            name: 'status',
            field: 'status',
            label: { en: 'Status', de: 'Status', fr: 'Statut' },
            align: 'left',
            sortable: true,
            renderAs: 'status',
          },
          {
            name: 'created_at',
            field: 'createdAt',
            label: { en: 'Registered', de: 'Angemeldet', fr: 'Inscrit' },
            align: 'left',
            sortable: true,
            renderAs: 'time_ago',
          },
        ],
        order: 1,
        filterStatus: ['WAITLISTED'],
        indexed: true,
        actions: true,
        sortBy: 'created_at',
        sortDirection: 'asc',
      },
      camp: { connect: { id: '01K9ATF1H9KD1K6H12F3YK8RWR' } },
    });

    // Summer camp – Medical
    await TableTemplateFactory.create({
      data: {
        title: { en: 'Medical', de: 'Medizinisches', fr: 'Médical' },
        columns: [
          {
            name: 'first_name',
            field: 'computedData.firstName',
            label: { en: 'First Name', de: 'Vorname', fr: 'Prénom' },
            align: 'left',
            sortable: true,
            renderAs: 'name',
          },
          {
            name: 'last_name',
            field: 'computedData.lastName',
            label: { en: 'Last Name', de: 'Nachname', fr: 'Nom de famille' },
            align: 'left',
            sortable: true,
            renderAs: 'name',
          },
          {
            name: 'medical_restrictions',
            field: 'data.medical_restrictions',
            label: {
              en: 'Medical Restrictions',
              de: 'Medizinische Einschränkungen',
              fr: 'Restrictions médicales',
            },
            align: 'left',
            sortable: false,
            renderAs: 'text',
          },
          {
            name: 'food_intolerance',
            field: 'data.food_intolerance',
            label: {
              en: 'Special Nutrition',
              de: 'Besondere Ernährung',
              fr: 'Alimentation spéciale',
            },
            align: 'left',
            sortable: false,
            renderAs: 'text',
          },
        ],
        order: 2,
        filterStatus: ['ACCEPTED'],
        indexed: true,
        sortBy: 'first_name',
      },
      camp: { connect: { id: '01K9ATF1H9KD1K6H12F3YK8RWR' } },
    });

    // Summer camp – Permissions
    await TableTemplateFactory.create({
      data: {
        title: { en: 'Permissions', de: 'Berechtigungen', fr: 'Autorisations' },
        columns: [
          {
            name: 'first_name',
            field: 'computedData.firstName',
            label: { en: 'First Name', de: 'Vorname', fr: 'Prénom' },
            align: 'left',
            sortable: true,
            renderAs: 'name',
          },
          {
            name: 'last_name',
            field: 'computedData.lastName',
            label: { en: 'Last Name', de: 'Nachname', fr: 'Nom de famille' },
            align: 'left',
            sortable: true,
            renderAs: 'name',
          },
          {
            name: 'permission_swim',
            field: 'data.permission_swim',
            label: { en: 'Swim', de: 'Schwimmen', fr: 'Natation' },
            align: 'left',
            sortable: true,
            renderAs: 'default',
          },
          {
            name: 'permission_written_consent',
            field: 'data.permission_written_consent',
            label: {
              en: 'Written Consent',
              de: 'Schriftliche Einwilligung',
              fr: 'Consentement écrit',
            },
            align: 'left',
            sortable: true,
            renderAs: 'default',
          },
          {
            name: 'permission_leave',
            field: 'data.permission_leave',
            label: { en: 'Leave', de: 'Verlassen', fr: 'Sortie' },
            align: 'left',
            sortable: true,
            renderAs: 'icon_mapping',
            renderOptions: {
              mappings: [
                { value: '2', icon: 'person', color: 'positive' },
                { value: '1', icon: 'groups', color: 'warning' },
                { value: '0', icon: 'close', color: 'negative' },
              ],
              fallback: { icon: 'question_mark', color: 'grey' },
            },
          },
        ],
        order: 3,
        filterStatus: ['ACCEPTED'],
        indexed: true,
        sortBy: 'first_name',
      },
      camp: { connect: { id: '01K9ATF1H9KD1K6H12F3YK8RWR' } },
    });
  }
}

export default new TableTemplateSeeder();
