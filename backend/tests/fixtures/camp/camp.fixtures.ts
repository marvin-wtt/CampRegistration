import moment from 'moment/moment';
import { Prisma } from '#generated/prisma/client';

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

type CreateBodyData = {
  name: string;
  data: object;
  expected: number;
};

export const campCreatedBody: CreateBodyData[] = [
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
  // Min age
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
      minAge: 10.2,
    },
    expected: 400,
  },
  {
    name: 'Min Age invalid decimals',
    data: {
      ...campCreateInternational,
      minAge: 10.2,
    },
    expected: 400,
  },
  // Max age
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
    name: 'Max Age invalid decimals',
    data: {
      ...campCreateInternational,
      maxAge: 15.2,
    },
    expected: 400,
  },
  {
    name: 'Max Age less than min age',
    data: {
      ...campCreateInternational,
      minAge: 11,
      maxAge: 10,
    },
    expected: 400,
  },
  // Start at
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
  // End at
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
  // Price
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
    name: 'Price invalid decimals',
    data: {
      ...campCreateInternational,
      price: 123.456,
    },
    expected: 400,
  },
  // Location
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

type UpdateBodyData = {
  name: string;
  camp?: Partial<Prisma.CampCreateInput>;
  data: object;
  expected: number;
};

export const campUpdateBody: UpdateBodyData[] = [
  // Active
  {
    name: 'Active',
    data: {
      active: true,
    },
    expected: 200,
  },
  {
    name: 'Active invalid',
    data: {
      active: 'disabled',
    },
    expected: 400,
  },
  // Public
  {
    name: 'Public',
    data: {
      public: false,
    },
    expected: 200,
  },
  {
    name: 'Public invalid',
    data: {
      public: 'private',
    },
    expected: 400,
  },
  // Countries
  {
    name: 'Countries',
    data: {
      countries: ['de'],
    },
    expected: 200,
  },
  {
    name: 'Countries empty',
    data: {
      countries: [],
    },
    expected: 400,
  },
  {
    name: 'Countries invalid locale',
    data: {
      countries: ['de', 'invalid'],
    },
    expected: 400,
  },
  {
    name: 'Countries invalid value',
    data: {
      countries: ['de', 1],
    },
    expected: 400,
  },
  // Name
  {
    name: 'Name',
    data: {
      name: 'Example camp',
    },
    expected: 200,
  },
  {
    name: 'Name international',
    camp: {
      countries: ['en', 'fr'],
    },
    data: {
      name: {
        en: 'Exemple camp',
        fr: 'Exemple de camp',
      },
    },
    expected: 200,
  },
  {
    name: 'Name null',
    data: {
      name: null,
    },
    expected: 400,
  },
  {
    name: 'Name invalid',
    data: {
      name: 10,
    },
    expected: 400,
  },
  {
    name: 'Name missing translation',
    camp: {
      countries: ['de', 'fr'],
    },
    data: {
      name: {
        fr: 'Exemple de camp',
      },
    },
    expected: 400,
  },
  {
    name: 'Name country added',
    camp: {
      countries: ['en', 'fr'],
      name: {
        en: 'Example camp',
        fr: 'Exemple de camp',
      },
    },
    data: {
      countries: ['de', 'en', 'fr'],
    },
    expected: 400,
  },
  {
    name: 'Name country removed',
    camp: {
      countries: ['en', 'fr'],
      name: {
        en: 'Example camp',
        fr: 'Exemple de camp',
      },
    },
    data: {
      countries: ['de'],
    },
    expected: 400,
  },
  // Organizer
  {
    name: 'Organization',
    data: {
      organizer: 'Example camp',
    },
    expected: 200,
  },
  {
    name: 'Organization international',
    camp: {
      countries: ['en', 'fr'],
    },
    data: {
      organizer: {
        en: 'Exemple organization',
        fr: "Exemple d'organisation",
      },
    },
    expected: 200,
  },
  {
    name: 'Organization null',
    data: {
      organizer: null,
    },
    expected: 400,
  },
  {
    name: 'Organization invalid',
    data: {
      organizer: 10,
    },
    expected: 400,
  },
  {
    name: 'Organization missing translation',
    camp: {
      countries: ['de', 'fr'],
    },
    data: {
      organizer: {
        fr: "Exemple d'organisation",
      },
    },
    expected: 400,
  },
  {
    name: 'Organization country added',
    camp: {
      countries: ['en', 'fr'],
      organizer: {
        en: 'Example organisation',
        fr: "Exemple d'organisation",
      },
    },
    data: {
      countries: ['de', 'en', 'fr'],
    },
    expected: 400,
  },
  {
    name: 'Organization country removed',
    camp: {
      countries: ['en', 'fr'],
      organizer: {
        en: 'Example organisation',
        fr: "Exemple d'organisation",
      },
    },
    data: {
      countries: ['de'],
    },
    expected: 400,
  },
  // Contact Email
  {
    name: 'Contact Email',
    data: {
      contactEmail: 'example@email.en',
    },
    expected: 200,
  },
  {
    name: 'Contact Email international',
    camp: {
      countries: ['en', 'fr'],
    },
    data: {
      contactEmail: {
        en: 'example@email.en',
        fr: 'example@email.fr',
      },
    },
    expected: 200,
  },
  {
    name: 'Contact Email null',
    data: {
      contactEmail: null,
    },
    expected: 400,
  },
  {
    name: 'Contact Email invalid format',
    data: {
      contactEmail: 'my-email',
    },
    expected: 400,
  },
  {
    name: 'Contact Email invalid',
    data: {
      contactEmail: 10,
    },
    expected: 400,
  },
  {
    name: 'Contact Email missing translation',
    camp: {
      countries: ['en', 'fr'],
    },
    data: {
      contactEmail: {
        fr: 'test@example.fr',
      },
    },
    expected: 400,
  },
  {
    name: 'Contact Email country added',
    camp: {
      countries: ['en', 'fr'],
      contactEmail: {
        en: 'example@email.en',
        fr: 'example@email.fr',
      },
    },
    data: {
      countries: ['de', 'en', 'fr'],
    },
    expected: 400,
  },
  {
    name: 'Contact Email country removed',
    camp: {
      countries: ['en', 'fr'],
      contactEmail: {
        en: 'example@email.en',
        fr: 'example@email.fr',
      },
    },
    data: {
      countries: ['de'],
    },
    expected: 400,
  },
  // Max Participants
  {
    name: 'Max Participants',
    data: {
      maxParticipants: 10,
    },
    expected: 200,
  },
  {
    name: 'Max Participants international',
    camp: {
      countries: ['en', 'fr'],
    },
    data: {
      maxParticipants: {
        en: 8,
        fr: 10,
      },
    },
    expected: 200,
  },
  {
    name: 'Max Participants null',
    data: {
      maxParticipants: null,
    },
    expected: 400,
  },
  {
    name: 'Max Participants negative',
    data: {
      maxParticipants: -10,
    },
    expected: 400,
  },
  {
    name: 'Max Participants partial negative',
    data: {
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
      maxParticipants: 'ten',
    },
    expected: 400,
  },
  {
    name: 'Max Participants partial invalid',
    data: {
      maxParticipants: {
        de: 10,
        fr: 'ten',
      },
    },
    expected: 400,
  },
  {
    name: 'Max Participants too many entries',
    camp: {
      countries: ['fr'],
    },
    data: {
      maxParticipants: {
        de: 10,
        fr: 10,
      },
    },
    expected: 400,
  },
  {
    name: 'Max Participants too many entries',
    camp: {
      countries: ['fr', 'de'],
    },
    data: {
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
    camp: {
      countries: ['fr', 'de'],
    },
    data: {
      maxParticipants: {
        fr: 11,
      },
    },
    expected: 400,
  },
  {
    name: 'Max Participants country added',
    camp: {
      countries: ['en', 'fr'],
      maxParticipants: {
        en: 2,
        fr: 3,
      },
    },
    data: {
      countries: ['de', 'en', 'fr'],
    },
    expected: 400,
  },
  {
    name: 'Max Participants country removed',
    camp: {
      countries: ['en', 'fr'],
      maxParticipants: {
        en: 2,
        fr: 3,
      },
    },
    data: {
      countries: ['de'],
    },
    expected: 400,
  },
  // Min age
  {
    name: 'Min Age',
    camp: {
      maxAge: 15,
    },
    data: {
      minAge: 10,
    },
    expected: 200,
  },
  {
    name: 'Min Age null',
    data: {
      minAge: null,
    },
    expected: 400,
  },
  {
    name: 'Min Age negative',
    data: {
      minAge: -1,
    },
    expected: 400,
  },
  {
    name: 'Min Age invalid',
    data: {
      minAge: false,
    },
    expected: 400,
  },
  {
    name: 'Min Age invalid decimal',
    data: {
      minAge: 10.2,
    },
    expected: 400,
  },
  {
    name: 'Min Age after max age',
    camp: {
      maxAge: 15,
    },
    data: {
      minAge: 16,
    },
    expected: 400,
  },
  // Max age
  {
    name: 'Max Age',
    camp: {
      minAge: 10,
    },
    data: {
      maxAge: 15,
    },
    expected: 200,
  },
  {
    name: 'Max Age missing',
    data: {
      maxAge: null,
    },
    expected: 400,
  },
  {
    name: 'Max Age negative',
    data: {
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
    name: 'Max Age invalid decimal',
    data: {
      maxAge: 8,
    },
    expected: 400,
  },
  {
    name: 'Max Age after min age',
    camp: {
      minAge: 10,
    },
    data: {
      maxAge: 8,
    },
    expected: 400,
  },
  {
    name: 'Max Age after min age',
    data: {
      minAge: 10,
      maxAge: 8,
    },
    expected: 400,
  },
  // Start at
  {
    name: 'Start At',
    camp: {
      endAt: '2024-01-02T01:00:00.000Z',
    },
    data: {
      startAt: '2024-01-01T01:00:00.000Z',
    },
    expected: 200,
  },
  {
    name: 'Start At null',
    data: {
      startAt: null,
    },
    expected: 400,
  },
  {
    name: 'Start At invalid format',
    data: {
      startAt: '01.01.2013',
    },
    expected: 400,
  },
  {
    name: 'Start At invalid',
    data: {
      startAt: '12',
    },
    expected: 400,
  },
  {
    name: 'Start At before end at',
    camp: {
      endAt: '2024-01-01T01:00:00.000Z',
    },
    data: {
      startAt: '2024-01-02T01:00:00.000Z',
    },
    expected: 400,
  },
  // End at
  {
    name: 'End At',
    camp: {
      startAt: '2024-01-01T01:00:00.000Z',
    },
    data: {
      endAt: '2024-01-02T01:00:00.000Z',
    },
    expected: 200,
  },
  {
    name: 'End At null',
    data: {
      endAt: null,
    },
    expected: 400,
  },
  {
    name: 'End At invalid format',
    data: {
      endAt: '01/11/1004',
    },
    expected: 400,
  },
  {
    name: 'End At invalid',
    data: {
      endAt: -6,
    },
    expected: 400,
  },
  {
    name: 'End At before Start At',
    data: {
      startAt: '2100-01-02T00:00:00.000Z',
      endAt: '2100-01-01T00:00:00.000Z',
    },
    expected: 400,
  },
  {
    name: 'End At before Start At',
    camp: {
      startAt: '2024-01-02T01:00:00.000Z',
    },
    data: {
      endAt: '2024-01-01T01:00:00.000Z',
    },
    expected: 400,
  },
  // Price
  {
    name: 'Price',
    data: {
      price: 100,
    },
    expected: 200,
  },
  {
    name: 'Price null',
    data: {
      price: null,
    },
    expected: 400,
  },
  {
    name: 'Price negative',
    data: {
      price: -10,
    },
    expected: 400,
  },
  {
    name: 'Price invalid',
    data: {
      price: 'for free',
    },
    expected: 400,
  },
  {
    name: 'Price invalid decimals',
    data: {
      price: 123.456,
    },
    expected: 400,
  },
  // Location
  {
    name: 'Location',
    data: {
      location: 'Somewhere',
    },
    expected: 200,
  },
  {
    name: 'Location international',
    camp: {
      countries: ['en', 'fr'],
    },
    data: {
      location: {
        en: 'Somewhere',
        fr: 'Quelque part',
      },
    },
    expected: 200,
  },
  {
    name: 'Location null',
    data: {
      location: null,
    },
    expected: 400,
  },
  {
    name: 'Location missing translation',
    data: {
      location: {
        fr: 'Quelque part',
      },
    },
    expected: 400,
  },
  {
    name: 'Location country added',
    camp: {
      countries: ['en', 'fr'],
      location: {
        en: 'Somewhere',
        fr: 'Quelque part',
      },
    },
    data: {
      countries: ['de', 'en', 'fr'],
    },
    expected: 400,
  },
  {
    name: 'Location country removed',
    camp: {
      countries: ['en', 'fr'],
      location: {
        en: 'Somewhere',
        fr: 'Quelque part',
      },
    },
    data: {
      countries: ['de'],
    },
    expected: 400,
  },
];
