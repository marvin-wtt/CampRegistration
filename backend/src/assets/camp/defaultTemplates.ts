export default [
  {
    title: {
      en: 'Overview',
      de: 'Übersicht',
      fr: 'Aperçu',
    },
    order: 0,
    columns: [
      {
        name: 'first_name',
        label: {
          en: 'First name',
          de: 'Vorname',
          fr: 'Prénom',
        },
        field: 'data.first_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'last_name',
        label: {
          en: 'last name',
          de: 'Nachname',
          fr: 'Nom de famille',
        },
        field: 'data.last_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'age',
        label: {
          en: 'Age',
          de: 'Alter',
          fr: 'Âge',
        },
        field: 'data.date_of_birth',
        renderAs: 'age',
        align: 'center',
        shrink: true,
        sortable: true,
      },
      {
        name: 'gender',
        label: {
          en: 'Gender',
          de: 'Geschlecht',
          fr: 'Sexe',
        },
        field: 'data.gender',
        renderAs: 'gender',
        align: 'center',
        shrink: true,
        sortable: true,
      },
      {
        name: 'country',
        label: {
          en: 'Country',
          de: 'Land',
          fr: 'Pays',
        },
        field: 'data.address.country',
        renderAs: 'country_flag',
        align: 'center',
        shrink: true,
        sortable: true,
      },
      {
        name: 'waiting_list',
        label: {
          en: 'Waiting list',
          de: 'Warteliste',
          fr: "Liste d'attendre",
        },
        field: 'waitingList',
        renderAs: 'icon',
        align: 'center',
        renderOptions: {
          name: 'hourglass_top',
          color: 'warning',
        },
        sortable: true,
        showIf: '$waitingList == true',
      },
      {
        name: 'created_at',
        label: {
          en: 'Registration time',
          de: 'Anmeldezeitpunkt',
          fr: "Moment de l'inscription",
        },
        field: 'createdAt',
        renderAs: 'time_ago',
        align: 'left',
        sortable: true,
      },
      {
        name: 'additional_information',
        label: {
          en: 'Additional information',
          de: 'Weitere Informationen',
          fr: "Plus d'informations",
        },
        field: 'data.additional_information',
        renderAs: 'text',
        align: 'left',
        shrink: true,
      },
    ],
    indexed: true,
    actions: true,
    sortBy: 'created_at',
    filterWaitingList: 'include',
    sortDirection: 'desc',
    filterRoles: ['counselor'],
  },
  {
    title: {
      en: 'List of participants',
      de: 'Teilnehmerliste',
      fr: 'Liste des participants',
    },
    order: 1,
    columns: [
      {
        name: 'first_name',
        label: {
          en: 'First name',
          de: 'Vorname',
          fr: 'Prénom',
        },
        field: 'data.first_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'last_name',
        label: {
          en: 'Last name',
          de: 'Nachname',
          fr: 'Nom de famille',
        },
        field: 'data.last_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'phone_number',
        label: {
          en: 'Phone number',
          de: 'Telefonnummer',
          fr: 'Téléphone',
        },
        field: 'data.phone_number',
        renderAs: 'phone_number',
        align: 'left',
      },
      {
        name: 'age',
        label: {
          en: 'Age',
          de: 'Alter',
          fr: 'Âge',
        },
        field: 'data.date_of_birth',
        renderAs: 'age',
        align: 'center',
      },
      {
        name: 'permission_leave',
        label: {
          en: 'Leave',
          de: 'Verlassen',
          fr: 'Sortir',
        },
        field: 'data.permission_leave',
        renderAs: 'permission_leave',
        align: 'center',
        shrink: true,
        headerVertical: true,
      },
      {
        name: 'permission_swim',
        label: {
          en: 'Swim',
          de: 'Schwimmen',
          fr: 'Nager',
        },
        field: 'data.permission_swim',
        renderAs: 'icon',
        align: 'center',
        renderOptions: {
          name: 'pool',
          color: 'negative',
        },
        headerVertical: true,
        shrink: true,
        showIf: '$data.permission_swim == false',
      },
      {
        name: 'privacy',
        label: {
          en: 'Photos',
          de: 'Fotos',
          fr: 'Photos',
        },
        field: 'data.consent_privacy',
        renderAs: 'icon',
        align: 'center',
        headerVertical: true,
        shrink: true,
        showIf: '$data.consent_privacy != true',
        renderOptions: {
          name: 'no_photography',
          color: 'negative',
        },
      },
      {
        name: 'room',
        label: {
          en: 'Room',
          de: 'Zimmer',
          fr: 'Chambre',
        },
        field: 'room',
        renderAs: 'translated_value',
        align: 'left',
      },
    ],
    indexed: true,
    sortBy: 'first_name',
    filterWaitingList: 'exclude',
    filterRoles: ['counselor'],
  },
  {
    title: {
      en: 'Counselors',
      de: 'Betreuer',
      fr: 'Conseiller',
    },
    order: 2,
    columns: [
      {
        name: 'first_name',
        label: {
          en: 'First name',
          de: 'Vorname',
          fr: 'Prénom',
        },
        field: 'data.first_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'last_name',
        label: {
          en: 'Last name',
          de: 'Nachname',
          fr: 'Nom de la famille',
        },
        field: 'data.last_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'age',
        label: {
          en: 'Age',
          de: 'Alter',
          fr: 'Âgre',
        },
        field: 'data.date_of_birth',
        renderAs: 'age',
        align: 'center',
        sortable: true,
      },
      {
        name: 'country',
        label: {
          en: 'Country',
          de: 'Land',
          fr: 'Pays',
        },
        field: 'data.address.country',
        renderAs: 'country_flag',
        align: 'center',
        sortable: true,
      },
      {
        name: 'privacy',
        label: {
          en: 'Pictures',
          de: 'Fotos',
          fr: 'Photos',
        },
        field: 'data.consent_privacy',
        renderAs: 'icon',
        showIf: '$data.consent_privacy != true',
        renderOptions: {
          name: 'no_photography',
          color: 'negative',
        },
        align: 'center',
        headerVertical: true,
      },
      {
        name: 'role',
        label: {
          en: 'Role',
          de: 'Rolle',
          fr: 'Rôle',
        },
        field: 'data.role',
        renderAs: 'default',
        align: 'left',
      },
    ],
    sortBy: 'first_name',
    indexed: true,
    actions: false,
    filterRoles: ['participant'],
  },
  {
    title: {
      en: 'Emergency Contacts',
      de: 'Notfallkontakte',
      fr: "Contacts d'urgence",
    },
    order: 3,
    columns: [
      {
        name: 'first_name',
        label: {
          en: 'First name',
          de: 'Vorname',
          fr: 'Prénom',
        },
        field: 'data.first_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'last_name',
        label: {
          en: 'Last name',
          de: 'Nachname',
          fr: 'Nom de la famille',
        },
        field: 'data.last_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'age',
        label: {
          en: 'Age',
          de: 'Alter',
          fr: 'Âge',
        },
        field: 'data.date_of_birth',
        renderAs: 'age',
        align: 'center',
      },
      {
        name: 'date_of_birth',
        label: {
          en: 'Date of birth',
          de: 'Geburtsdatum',
          fr: 'Date de naissance',
        },
        field: 'data.date_of_birth',
        renderAs: 'date',
        align: 'center',
        headerVertical: false,
        shrink: true,
      },
      {
        name: 'gender',
        label: {
          en: 'Gender',
          de: 'Geschlecht',
          fr: 'Sexe',
        },
        field: 'data.gender',
        renderAs: 'gender',
        align: 'center',
        shrink: true,
      },
      {
        name: 'contact_description',
        label: {
          en: 'Contact',
          de: 'Kontakt',
          fr: 'Contact',
        },
        field: 'data.emergency_contacts.*.description',
        renderAs: 'default',
        align: 'left',
        isArray: true,
      },
      {
        name: 'phone_number',
        label: {
          en: 'Phone number',
          fr: 'Numéro de téléphone',
          de: 'Telefonnummer',
        },
        field: 'data.emergency_contacts.*.phone_number',
        renderAs: 'phone_number',
        isArray: true,
        align: 'left',
      },
    ],
    filterWaitingList: 'exclude',
    sortBy: 'first_name',
    filterRoles: ['counselor'],
  },
  {
    title: {
      en: 'Legal guardian',
      de: 'Sorgeberechtigten ',
      fr: 'Responsable légal',
    },
    order: 4,
    columns: [
      {
        name: 'first_name',
        label: {
          en: 'First name',
          de: 'Vorname',
          fr: 'Prénom',
        },
        field: 'data.first_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'last_name',
        label: {
          en: 'Last name',
          de: 'Nachname',
          fr: 'Nom de la famille',
        },
        field: 'data.last_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'guardian_first_name',
        label: {
          en: 'First name',
          de: 'Vorname',
          fr: 'Prénom',
        },
        field: 'data.guardian_first_name',
        renderAs: 'name',
        align: 'left',
      },
      {
        name: 'guardian_last_name',
        label: {
          en: 'Last name',
          de: 'Nachname',
          fr: 'Nom de la famille',
        },
        field: 'data.guardian_last_name',
        renderAs: 'name',
        align: 'left',
      },
      {
        name: 'guardian_email',
        label: {
          en: 'Email',
          de: 'Email',
          fr: 'Email',
        },
        field: 'data.guardian_email',
        renderAs: 'email',
        align: 'left',
      },
    ],
    filterRoles: ['counselor'],
    filterWaitingList: 'exclude',
    sortBy: 'first_name',
  },
  {
    title: {
      en: 'Contact details',
      de: 'Kontaktdaten',
      fr: 'Coordonnées',
    },
    order: 5,
    columns: [
      {
        name: 'first_name',
        label: {
          en: 'First name',
          de: 'Vorname',
          fr: 'Prénom',
        },
        field: 'data.first_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'last_name',
        label: {
          en: 'Last name',
          de: 'Nachname',
          fr: 'Nom de famille',
        },
        field: 'data.last_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'date_of_birth',
        label: {
          en: 'Age',
          de: 'Alter',
          fr: 'Âge',
        },
        field: 'data.date_of_birth',
        renderAs: 'age',
        align: 'center',
      },
      {
        name: 'phone_number',
        label: {
          en: 'Phone number',
          de: 'Telefonnummer',
          fr: 'Téléphone',
        },
        field: 'data.phone_number',
        renderAs: 'phone_number',
        align: 'left',
      },
      {
        name: 'email',
        label: {
          en: 'E-Mail',
          de: 'E-Mail',
          fr: 'E-Mail',
        },
        field: 'data.email',
        renderAs: 'email',
        align: 'left',
      },
      {
        name: 'address',
        label: {
          en: 'Address',
          de: 'Adresse',
          fr: 'Adresse',
        },
        field: 'data.address',
        renderAs: 'address',
        align: 'left',
      },
      {
        name: 'forward',
        label: {
          en: 'Forward',
          de: 'Weiterleiten',
          fr: 'Transmettre',
        },
        field: 'data.consent_forward_list_participants',
        renderAs: 'default',
        sortable: true,
      },
    ],
    indexed: true,
    sortBy: 'first_name',
    filterWaitingList: 'exclude',
    filterRoles: ['counselor'],
  },
  {
    title: {
      en: 'Additional information',
      de: 'Weitere Informationen',
      fr: "Plus d'informations",
    },
    order: 6,
    columns: [
      {
        name: 'first_name',
        label: {
          en: 'First name',
          de: 'Vorname',
          fr: 'Prénom',
        },
        field: 'data.first_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'last_name',
        label: {
          en: 'Last name',
          de: 'Nachname',
          fr: 'Nom de la famille',
        },
        field: 'data.last_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'food',
        label: {
          en: 'Nutrition',
          de: 'Ernährung',
          fr: 'Alimentation',
        },
        field: 'data.food_intolerance',
        renderAs: 'text',
        align: 'left',
      },
      {
        name: 'medical_restristrions',
        label: {
          en: 'Restrictions',
          de: 'Einschränkungen',
          fr: 'Restrictions',
        },
        field: 'data.medical_restrictions',
        renderAs: 'text',
        align: 'left',
      },
      {
        name: 'additional_information',
        label: {
          en: 'Additional information',
          de: 'Weitere Informationen',
          fr: "Plus d'informations",
        },
        field: 'data.additional_information',
        renderAs: 'text',
        align: 'left',
      },
      {
        name: 'language_skills',
        label: {
          fr: 'Connaissances linguistiques',
          de: 'Sprachkenntnisse',
          en: 'Language skills',
        },
        field: 'data.language_skills',
        renderAs: 'language_skills',
        align: 'center',
        shrink: true,
      },
    ],
    indexed: true,
    filterWaitingList: 'exclude',
    sortBy: 'first_name',
  },
  {
    title: {
      en: 'Waiting list',
      de: 'Warteliste',
      fr: "Liste d'attente",
    },
    order: 7,
    columns: [
      {
        name: 'first_name',
        label: {
          en: 'First name',
          de: 'Vorname',
          fr: 'Prénom',
        },
        field: 'data.first_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'last_name',
        label: {
          en: 'Last name',
          de: 'Nachname',
          fr: 'Nom de la famille',
        },
        field: 'data.last_name',
        renderAs: 'name',
        align: 'left',
        sortable: true,
      },
      {
        name: 'country',
        label: {
          en: 'Country',
          de: 'Land',
          fr: 'Pays',
        },
        field: 'data.address.country',
        renderAs: 'country_flag',
        align: 'center',
        shrink: true,
      },
      {
        name: 'date',
        label: {
          en: 'Timestamp',
          de: 'Zeitpunkt',
          fr: 'Moment',
        },
        field: 'createdAt',
        renderAs: 'time_ago',
        align: 'center',
        sortable: true,
      },
    ],
    filterWaitingList: 'only',
    indexed: true,
    actions: true,
    sortBy: 'date',
  },
];
