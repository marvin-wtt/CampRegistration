import moment from 'moment/moment';

export const campActivePublic = {
  active: true,
  public: true,
};

export const campActivePrivate = {
  active: true,
  public: false,
};

export const campInactive = {
  active: false,
};

export const campCreateNational = {
  active: false,
  public: false,
  countries: ['de'],
  name: 'Test Camp',
  organizer: 'Test Org',
  contactEmail: 'test@example.com',
  maxParticipants: 10,
  minAge: 10,
  maxAge: 15,
  startAt: moment().add(20, 'days').startOf('hour').toDate().toISOString(),
  endAt: moment().add(22, 'days').startOf('hour').toDate().toISOString(),
  price: 100.0,
  location: 'Somewhere',
};

export const campCreateInternational = {
  ...campCreateNational,
  countries: ['de', 'fr'],
  name: {
    de: 'Beispiel Camp',
    fr: 'Exemple de camp',
  },
  organizer: {
    de: 'Beispiel Organisation',
    fr: "Exemple d'organisation",
  },
  contactEmail: {
    de: 'test@example.de',
    fr: 'test@example.fr',
  },
  location: {
    de: 'Irgendwo',
    fr: 'Quelque part',
  },
  maxParticipants: {
    de: 10,
    fr: 11,
  },
};

type InvalidBodyData = {
  name: string;
  data: object;
  expected: number;
};

export const campCreateInvalidBody: InvalidBodyData[] = [
  // Active
  {
    name: 'Active missing',
    data: {
      ...campCreateInternational,
      active: undefined,
    },
    expected: 201,
  },
  {
    name: 'Active invalid',
    data: {
      ...campCreateInternational,
      active: 'disabled',
    },
    expected: 400,
  },
  // Public
  {
    name: 'Public invalid',
    data: {
      ...campCreateInternational,
      public: 'private',
    },
    expected: 400,
  },
  // Countries
  {
    name: 'Countries missing',
    data: {
      ...campCreateInternational,
      countries: undefined,
    },
    expected: 400,
  },
  {
    name: 'Countries missing',
    data: {
      ...campCreateInternational,
      countries: undefined,
    },
    expected: 400,
  },
  {
    name: 'Countries empty',
    data: {
      ...campCreateInternational,
      countries: [],
    },
    expected: 400,
  },
  {
    name: 'Countries invalid locale',
    data: {
      ...campCreateInternational,
      countries: ['de', 'invalid'],
    },
    expected: 400,
  },
  {
    name: 'Countries invalid value',
    data: {
      ...campCreateInternational,
      countries: ['de', 1],
    },
    expected: 400,
  },
  // Name
  {
    name: 'Name missing',
    data: {
      ...campCreateInternational,
      name: undefined,
    },
    expected: 400,
  },
  {
    name: 'Name invalid',
    data: {
      ...campCreateInternational,
      name: 10,
    },
    expected: 400,
  },
  {
    name: 'Name missing translation',
    data: {
      ...campCreateInternational,
      name: {
        fr: 'Exemple de camp',
      },
    },
    expected: 400,
  },
  // Organizer
  {
    name: 'Organization missing',
    data: {
      ...campCreateInternational,
      organizer: undefined,
    },
    expected: 400,
  },
  {
    name: 'Organization invalid',
    data: {
      ...campCreateInternational,
      organizer: 10,
    },
    expected: 400,
  },
  {
    name: 'Organization missing translation',
    data: {
      ...campCreateInternational,
      organizer: {
        fr: "Exemple d'organisation",
      },
    },
    expected: 400,
  },
  // Contact Email
  {
    name: 'Contact Email missing',
    data: {
      ...campCreateInternational,
      contactEmail: undefined,
    },
    expected: 400,
  },
  {
    name: 'Contact Email invalid format',
    data: {
      ...campCreateInternational,
      contactEmail: 'my-email',
    },
    expected: 400,
  },
  {
    name: 'Contact Email invalid',
    data: {
      ...campCreateInternational,
      contactEmail: 10,
    },
    expected: 400,
  },
  {
    name: 'Contact Email missing translation',
    data: {
      ...campCreateInternational,
      contactEmail: {
        fr: 'test@example.fr',
      },
    },
    expected: 400,
  },
  // Max Participants
  {
    name: 'Max Participants missing',
    data: {
      ...campCreateInternational,
      maxParticipants: undefined,
    },
    expected: 400,
  },
  {
    name: 'Max Participants negative',
    data: {
      ...campCreateInternational,
      maxParticipants: -10,
    },
    expected: 400,
  },
  {
    name: 'Max Participants partial negative',
    data: {
      ...campCreateInternational,
      maxParticipants: {
        de: 10,
        fr: -10,
      },
    },
    expected: 400,
  },
  {
    name: 'Max Participants invalid',
    data: {
      ...campCreateInternational,
      maxParticipants: 'ten',
    },
    expected: 400,
  },
  {
    name: 'Max Participants partial invalid',
    data: {
      ...campCreateInternational,
      maxParticipants: {
        de: 10,
        fr: 'ten',
      },
    },
    expected: 400,
  },
  {
    name: 'Max Participants too many entries',
    data: {
      ...campCreateNational,
      maxParticipants: {
        de: 10,
        fr: 10,
      },
    },
    expected: 400,
  },
  {
    name: 'Max Participants too many entries',
    data: {
      ...campCreateInternational,
      maxParticipants: {
        de: 10,
        fr: 10,
        pl: 10,
      },
    },
    expected: 400,
  },
  {
    name: 'Max Participants missing value',
    data: {
      ...campCreateInternational,
      maxParticipants: {
        fr: 11,
      },
    },
    expected: 400,
  },
  {
    name: 'Min Age missing',
    data: {
      ...campCreateInternational,
      minAge: undefined,
    },
    expected: 400,
  },
  {
    name: 'Min Age negative',
    data: {
      ...campCreateInternational,
      minAge: -1,
    },
    expected: 400,
  },
  {
    name: 'Min Age invalid',
    data: {
      ...campCreateInternational,
      minAge: false,
    },
    expected: 400,
  },
  {
    name: 'Max Age missing',
    data: {
      ...campCreateInternational,
      maxAge: undefined,
    },
    expected: 400,
  },
  {
    name: 'Max Age negative',
    data: {
      ...campCreateInternational,
      maxAge: -10,
    },
    expected: 400,
  },
  {
    name: 'Max Age invalid',
    data: {
      ...campCreateInternational,
      maxAge: 'ten',
    },
    expected: 400,
  },
  {
    name: 'Start At missing',
    data: {
      ...campCreateInternational,
      startAt: undefined,
    },
    expected: 400,
  },
  {
    name: 'Start At invalid format',
    data: {
      ...campCreateInternational,
      startAt: '01.01.2013',
    },
    expected: 400,
  },
  {
    name: 'Start At invalid',
    data: {
      ...campCreateInternational,
      startAt: '12',
    },
    expected: 400,
  },
  {
    name: 'End At missing',
    data: {
      ...campCreateInternational,
      endAt: undefined,
    },
    expected: 400,
  },
  {
    name: 'End At invalid format',
    data: {
      ...campCreateInternational,
      endAt: '01/11/1004',
    },
    expected: 400,
  },
  {
    name: 'End At invalid',
    data: {
      ...campCreateInternational,
      endAt: -6,
    },
    expected: 400,
  },
  {
    name: 'End At before Start At',
    data: {
      ...campCreateInternational,
      startAt: '2100-01-02T00:00:00.000Z',
      endAt: '2100-01-01T00:00:00.000Z',
    },
    expected: 400,
  },
  {
    name: 'Price missing',
    data: {
      ...campCreateInternational,
      price: undefined,
    },
    expected: 400,
  },
  {
    name: 'Price negative',
    data: {
      ...campCreateInternational,
      price: -10,
    },
    expected: 400,
  },
  {
    name: 'Price invalid',
    data: {
      ...campCreateInternational,
      price: 'for free',
    },
    expected: 400,
  },
  {
    name: 'Location missing',
    data: {
      ...campCreateInternational,
      location: undefined,
    },
    expected: 400,
  },
  {
    name: 'Location missing translation',
    data: {
      ...campCreateInternational,
      location: {
        fr: 'Quelque part',
      },
    },
    expected: 400,
  },
];
