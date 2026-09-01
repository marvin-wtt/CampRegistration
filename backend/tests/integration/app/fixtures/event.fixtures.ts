import moment from 'moment';
import { Prisma } from '#generated/prisma/client.js';
import { createForm } from '../utils/form.js';
import type { EventCreateData } from '@camp-registration/common/entities';

export const eventListed = {
  listed: true,
};

export const eventUnlisted = {
  listed: false,
};

/**
 * Fixed id for the verified organization every event-creation fixture is created
 * under. The suite truncates between tests, so a constant is safe and keeps the
 * fixtures free of per-test wiring.
 */
export const EVENT_CREATE_ORGANIZATION_ID = '01K9ATF1H9KD1K6H12F3YK8RGZ';

export const eventCreateNational = {
  organizationId: EVENT_CREATE_ORGANIZATION_ID,
  listed: false,
  confirmationMode: 'AUTOMATIC' as const,
  countries: ['de'],
  name: 'Test Event',
  organizer: 'Test Org',
  contactEmail: 'test@example.com',
  maxParticipants: 10,
  minAge: 10,
  maxAge: 15,
  startAt: moment().add(20, 'days').startOf('hour').toDate().toISOString(),
  endAt: moment().add(22, 'days').startOf('hour').toDate().toISOString(),
  price: 100.0,
  location: 'Somewhere',
} satisfies EventCreateData;

export const eventInputNational: Partial<Prisma.EventCreateInput> = {
  organization: { connect: { id: EVENT_CREATE_ORGANIZATION_ID } },
  listed: false,
  confirmationMode: 'AUTOMATIC' as const,
  countries: ['de'],
  name: 'Test Event',
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

export const eventCreateInternational = {
  ...eventCreateNational,
  countries: ['de', 'fr'],
  name: {
    de: 'Beispiel Event',
    fr: 'Exemple de event',
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

export const eventCreatedBody: CreateBodyData[] = [
  // Registration window
  {
    name: 'Registration open at valid',
    data: {
      ...eventCreateInternational,
      registrationOpensAt: '2100-01-01T00:00:00.000Z',
    },
    expected: 201,
  },
  {
    name: 'Registration open at null',
    data: {
      ...eventCreateInternational,
      registrationOpensAt: null,
    },
    expected: 201,
  },
  {
    name: 'Registration open at invalid',
    data: {
      ...eventCreateInternational,
      registrationOpensAt: 'not-a-date',
    },
    expected: 400,
  },
  {
    name: 'Registration close at valid',
    data: {
      ...eventCreateInternational,
      registrationClosesAt: '2100-01-01T00:00:00.000Z',
    },
    expected: 201,
  },
  {
    name: 'Registration close at null',
    data: {
      ...eventCreateInternational,
      registrationClosesAt: null,
    },
    expected: 201,
  },
  {
    name: 'Registration close at invalid',
    data: {
      ...eventCreateInternational,
      registrationClosesAt: 'not-a-date',
    },
    expected: 400,
  },
  // Listed
  {
    name: 'Listed invalid',
    data: {
      ...eventCreateInternational,
      listed: 'private',
    },
    expected: 400,
  },
  // Countries
  {
    name: 'Countries missing',
    data: {
      ...eventCreateInternational,
      countries: undefined,
    },
    expected: 400,
  },
  {
    name: 'Countries missing',
    data: {
      ...eventCreateInternational,
      countries: undefined,
    },
    expected: 400,
  },
  {
    name: 'Countries empty',
    data: {
      ...eventCreateInternational,
      countries: [],
    },
    expected: 400,
  },
  {
    name: 'Countries invalid locale',
    data: {
      ...eventCreateInternational,
      countries: ['de', 'invalid'],
    },
    expected: 400,
  },
  {
    name: 'Countries invalid value',
    data: {
      ...eventCreateInternational,
      countries: ['de', 1],
    },
    expected: 400,
  },
  // Name
  {
    name: 'Name missing',
    data: {
      ...eventCreateInternational,
      name: undefined,
    },
    expected: 400,
  },
  {
    name: 'Name invalid',
    data: {
      ...eventCreateInternational,
      name: 10,
    },
    expected: 400,
  },
  {
    name: 'Name missing translation',
    data: {
      ...eventCreateInternational,
      name: {
        fr: 'Exemple de event',
      },
    },
    expected: 400,
  },
  // Organizer
  {
    name: 'Organization missing',
    data: {
      ...eventCreateInternational,
      organizer: undefined,
    },
    expected: 400,
  },
  {
    name: 'Organization invalid',
    data: {
      ...eventCreateInternational,
      organizer: 10,
    },
    expected: 400,
  },
  {
    name: 'Organization missing translation',
    data: {
      ...eventCreateInternational,
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
      ...eventCreateInternational,
      contactEmail: undefined,
    },
    expected: 400,
  },
  {
    name: 'Contact Email invalid format',
    data: {
      ...eventCreateInternational,
      contactEmail: 'my-email',
    },
    expected: 400,
  },
  {
    name: 'Contact Email invalid',
    data: {
      ...eventCreateInternational,
      contactEmail: 10,
    },
    expected: 400,
  },
  {
    name: 'Contact Email missing translation',
    data: {
      ...eventCreateInternational,
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
      ...eventCreateInternational,
      maxParticipants: undefined,
    },
    expected: 400,
  },
  {
    name: 'Max Participants negative',
    data: {
      ...eventCreateInternational,
      maxParticipants: -10,
    },
    expected: 400,
  },
  {
    name: 'Max Participants partial negative',
    data: {
      ...eventCreateInternational,
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
      ...eventCreateInternational,
      maxParticipants: 'ten',
    },
    expected: 400,
  },
  {
    name: 'Max Participants partial invalid',
    data: {
      ...eventCreateInternational,
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
      ...eventCreateNational,
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
      ...eventCreateInternational,
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
      ...eventCreateInternational,
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
      ...eventCreateInternational,
      minAge: undefined,
    },
    expected: 400,
  },
  {
    name: 'Min Age negative',
    data: {
      ...eventCreateInternational,
      minAge: -1,
    },
    expected: 400,
  },
  {
    name: 'Min Age invalid',
    data: {
      ...eventCreateInternational,
      minAge: 10.2,
    },
    expected: 400,
  },
  {
    name: 'Min Age invalid decimals',
    data: {
      ...eventCreateInternational,
      minAge: 10.2,
    },
    expected: 400,
  },
  // Max age
  {
    name: 'Max Age missing',
    data: {
      ...eventCreateInternational,
      maxAge: undefined,
    },
    expected: 400,
  },
  {
    name: 'Max Age negative',
    data: {
      ...eventCreateInternational,
      maxAge: -10,
    },
    expected: 400,
  },
  {
    name: 'Max Age invalid',
    data: {
      ...eventCreateInternational,
      maxAge: 'ten',
    },
    expected: 400,
  },
  {
    name: 'Max Age invalid decimals',
    data: {
      ...eventCreateInternational,
      maxAge: 15.2,
    },
    expected: 400,
  },
  {
    name: 'Max Age less than min age',
    data: {
      ...eventCreateInternational,
      minAge: 11,
      maxAge: 10,
    },
    expected: 400,
  },
  // Start at
  {
    name: 'Start At missing',
    data: {
      ...eventCreateInternational,
      startAt: undefined,
    },
    expected: 400,
  },
  {
    name: 'Start At invalid format',
    data: {
      ...eventCreateInternational,
      startAt: '01.01.2013',
    },
    expected: 400,
  },
  {
    name: 'Start At invalid',
    data: {
      ...eventCreateInternational,
      startAt: '12',
    },
    expected: 400,
  },
  // End at
  {
    name: 'End At missing',
    data: {
      ...eventCreateInternational,
      endAt: undefined,
    },
    expected: 400,
  },
  {
    name: 'End At invalid format',
    data: {
      ...eventCreateInternational,
      endAt: '01/11/1004',
    },
    expected: 400,
  },
  {
    name: 'End At invalid',
    data: {
      ...eventCreateInternational,
      endAt: -6,
    },
    expected: 400,
  },
  {
    name: 'End At before Start At',
    data: {
      ...eventCreateInternational,
      startAt: '2100-01-02T00:00:00.000Z',
      endAt: '2100-01-01T00:00:00.000Z',
    },
    expected: 400,
  },
  // Price
  {
    name: 'Price missing',
    data: {
      ...eventCreateInternational,
      price: undefined,
    },
    expected: 400,
  },
  {
    name: 'Price negative',
    data: {
      ...eventCreateInternational,
      price: -10,
    },
    expected: 400,
  },
  {
    name: 'Price invalid',
    data: {
      ...eventCreateInternational,
      price: 'for free',
    },
    expected: 400,
  },
  {
    name: 'Price invalid decimals',
    data: {
      ...eventCreateInternational,
      price: 123.456,
    },
    expected: 400,
  },
  // Location
  {
    name: 'Location missing',
    data: {
      ...eventCreateInternational,
      location: undefined,
    },
    expected: 400,
  },
  {
    name: 'Location missing translation',
    data: {
      ...eventCreateInternational,
      location: {
        fr: 'Quelque part',
      },
    },
    expected: 400,
  },
  // Confirmation mode
  {
    name: 'Confirmation mode automatic',
    data: {
      ...eventCreateInternational,
      confirmationMode: 'AUTOMATIC',
    },
    expected: 201,
  },
  {
    name: 'Confirmation mode manual',
    data: {
      ...eventCreateInternational,
      confirmationMode: 'MANUAL',
    },
    expected: 201,
  },
  {
    name: 'Confirmation mode invalid',
    data: {
      ...eventCreateInternational,
      confirmationMode: 'SEMI-AUTOMATIC',
    },
    expected: 400,
  },
  {
    name: 'Confirmation missing',
    data: {
      ...eventCreateInternational,
      confirmationMode: undefined,
    },
    expected: 201,
  },
  // Preset
  {
    name: 'Preset camp',
    data: {
      ...eventCreateInternational,
      preset: 'camp',
    },
    expected: 201,
  },
  {
    name: 'Preset seminar',
    data: {
      ...eventCreateInternational,
      preset: 'seminar',
    },
    expected: 201,
  },
  {
    name: 'Preset missing',
    data: {
      ...eventCreateInternational,
      preset: undefined,
    },
    expected: 201,
  },
  {
    name: 'Preset invalid',
    data: {
      ...eventCreateInternational,
      preset: 'full',
    },
    expected: 400,
  },
];

type UpdateBodyData = {
  name: string;
  event?: Partial<Prisma.EventCreateInput>;
  data: object;
  expected: number;
};

export const eventUpdateBody: UpdateBodyData[] = [
  // Registration window
  {
    name: 'Registration open at',
    data: {
      registrationOpensAt: '2100-01-01T00:00:00.000Z',
    },
    expected: 200,
  },
  {
    name: 'Registration open at null',
    data: {
      registrationOpensAt: null,
    },
    expected: 200,
  },
  {
    name: 'Registration open at invalid',
    data: {
      registrationOpensAt: 'not-a-date',
    },
    expected: 400,
  },
  {
    name: 'Registration close at',
    data: {
      registrationClosesAt: '2100-01-01T00:00:00.000Z',
    },
    expected: 200,
  },
  {
    name: 'Registration close at null',
    data: {
      registrationClosesAt: null,
    },
    expected: 200,
  },
  {
    name: 'Registration close at invalid',
    data: {
      registrationClosesAt: 'not-a-date',
    },
    expected: 400,
  },
  // Listed
  {
    name: 'Listed',
    data: {
      listed: false,
    },
    expected: 200,
  },
  {
    name: 'Listed invalid',
    data: {
      listed: 'private',
    },
    expected: 400,
  },
  // Name
  {
    name: 'Name',
    data: {
      name: 'Example event',
    },
    expected: 200,
  },
  {
    name: 'Name international',
    event: {
      countries: ['en', 'fr'],
    },
    data: {
      name: {
        en: 'Exemple event',
        fr: 'Exemple de event',
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
    event: {
      countries: ['de', 'fr'],
    },
    data: {
      name: {
        fr: 'Exemple de event',
      },
    },
    expected: 400,
  },
  // Organizer
  {
    name: 'Organization',
    data: {
      organizer: 'Example event',
    },
    expected: 200,
  },
  {
    name: 'Organization international',
    event: {
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
    event: {
      countries: ['de', 'fr'],
    },
    data: {
      organizer: {
        fr: "Exemple d'organisation",
      },
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
    event: {
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
    event: {
      countries: ['en', 'fr'],
    },
    data: {
      contactEmail: {
        fr: 'test@example.fr',
      },
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
    event: {
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
    event: {
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
    event: {
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
    event: {
      countries: ['fr', 'de'],
    },
    data: {
      maxParticipants: {
        fr: 11,
      },
    },
    expected: 400,
  },
  // Min age
  {
    name: 'Min Age',
    event: {
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
    event: {
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
    event: {
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
      ...eventCreateInternational,
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
    event: {
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
    event: {
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
    event: {
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
    event: {
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
    event: {
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
    event: {
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
  // Confirmation mode
  {
    name: 'Confirmation mode automatic',
    data: {
      confirmationMode: 'AUTOMATIC',
    },
    expected: 200,
  },
  {
    name: 'Confirmation mode manual',
    data: {
      confirmationMode: 'MANUAL',
    },
    expected: 200,
  },
  {
    name: 'Confirmation mode invalid',
    data: {
      confirmationMode: 'SEMI-AUTOMATIC',
    },
    expected: 400,
  },
];

export const eventWithForm = {
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      eventDataType: 'first_name',
      isRequired: true,
    },
    {
      name: 'email',
      type: 'text',
      isRequired: true,
    },
    {
      name: 'role',
      type: 'text',
      eventDataType: 'role',
      isRequired: true,
    },
  ]),
};

export const eventUpdateBodyWithForm = {
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      eventDataType: 'first_name',
      isRequired: true,
    },
    {
      name: 'email',
      type: 'text',
      eventDataType: 'email',
      isRequired: true,
    },
    {
      name: 'role',
      type: 'text',
      isRequired: true,
    },
  ]),
};
