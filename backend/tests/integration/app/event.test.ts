import { describe, expect, it } from 'vitest';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';
import {
  EventFactory,
  UserFactory,
  EventManagerFactory,
  RegistrationFactory,
  TableTemplateFactory,
  FileFactory,
  MessageDeliveryFactory,
  MessageTemplateFactory,
  OrganizationFactory,
} from '../../../prisma/factories/index.js';
import { Event, Prisma } from '#generated/prisma/client.js';
import { eventRegistrationStatus } from '#app/event/event.util';
import { countriesToLocales } from '#utils/countriesToLocales';
import moment from 'moment';
import { ulid } from 'ulidx';
import {
  eventListed,
  eventUnlisted,
  eventCreateInternational,
  eventCreatedBody,
  eventCreateNational,
  eventUpdateBody,
  eventWithForm,
  eventUpdateBodyWithForm,
  EVENT_CREATE_ORGANIZATION_ID,
  eventInputNational,
} from './fixtures/event.fixtures.js';
import { request } from '../utils/request.js';
import { eventWithMaxParticipantsRolesInternational } from './fixtures/registration.fixtures.js';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// The unchecked variant: these assertions describe a request body and the row
// it produces, both of which carry a scalar `organizationId` rather than the
// nested `organization` relation of `EventCreateInput`.
type EventCreateData = PartialBy<
  Prisma.EventUncheckedCreateInput,
  'id' | 'form' | 'themes' | 'organizationId'
>;

const assertEventModel = async (id: string, data: EventCreateData) => {
  const event = (await prisma.event.findFirst({
    where: {
      id: id,
    },
  })) as Event;
  expect(event).not.toBeNull();

  expect(event).toEqual({
    id: data.id ?? expect.anything(),
    organizationId: data.organizationId ?? expect.anything(),
    listed: data.listed,
    registrationOpensAt: data.registrationOpensAt
      ? new Date(data.registrationOpensAt)
      : null,
    registrationClosesAt: data.registrationClosesAt
      ? new Date(data.registrationClosesAt)
      : null,
    confirmationMode: data.confirmationMode,
    countries: data.countries,
    name: data.name,
    organizer: data.organizer,
    contactEmail: data.contactEmail,
    maxParticipants: data.maxParticipants,
    minAge: data.minAge,
    maxAge: data.maxAge,
    startAt: new Date(data.startAt),
    endAt: new Date(data.endAt),
    price: data.price,
    location: data.location,
    form: data.form ?? expect.anything(),
    themes: data.themes ?? expect.anything(),
    // Written only by the retention reminder job, never on create or update.
    retentionReminderSentAt: null,
    updatedAt: expect.anything(),
    createdAt: expect.anything(),
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const assertEventResponseBody = (
  data: EventCreateData & { locales: string[] },
  body: any,
) => {
  expect(body).toHaveProperty('data');

  expect(body.data).toEqual({
    id: data.id ?? expect.anything(),
    organizationId: data.organizationId ?? expect.anything(),
    organizationName: expect.any(String),
    organizationVerificationStatus: expect.stringMatching(
      /^(PENDING|VERIFIED|REJECTED)$/,
    ),
    listed: data.listed,
    registrationOpensAt: data.registrationOpensAt ?? null,
    registrationClosesAt: data.registrationClosesAt ?? null,
    confirmationMode: data.confirmationMode,
    countries: data.countries,
    locales: data.locales,
    name: data.name,
    organizer: data.organizer,
    contactEmail: data.contactEmail,
    maxParticipants: data.maxParticipants,
    minAge: data.minAge,
    maxAge: data.maxAge,
    startAt: data.startAt,
    endAt: data.endAt,
    price: data.price,
    location: data.location,
    freePlaces: data.maxParticipants,
    registrationStatus: eventRegistrationStatus(data as Event),
    form: data.form ?? expect.anything(),
    themes: data.themes ?? expect.anything(),
  });
};

const createEventWithManagerAndToken = async (
  eventData: Partial<Prisma.EventCreateInput> = {},
  role = 'DIRECTOR',
) => {
  const user = await UserFactory.create();
  // Before the event: reference-event tests clone through `POST /events`, which
  // needs the caller to belong to the organization the create fixtures name —
  // and `eventData` may reference that same organization.
  await joinEventCreationOrganization(user.id);
  const event = await EventFactory.create(eventData);
  const manager = await EventManagerFactory.create({
    event: { connect: { id: event.id } },
    user: { connect: { id: user.id } },
    role,
  });
  const accessToken = generateAccessToken(user);

  return {
    event,
    user,
    manager,
    accessToken,
  };
};

/**
 * Makes `userId` an administrator of the verified organization the event-creation
 * fixtures point at ({@link EVENT_CREATE_ORGANIZATION_ID}) — creating a event now
 * requires membership of the organization named in the request body.
 *
 * Upserts so several users in one test can share it. Events built by
 * `EventFactory` get their own organization, so this never grants incidental
 * access to them.
 */
const joinEventCreationOrganization = async (userId: string) => {
  await prisma.organization.upsert({
    where: { id: EVENT_CREATE_ORGANIZATION_ID },
    update: { members: { create: { userId, role: 'ADMIN' } } },
    create: {
      ...OrganizationFactory.build({
        id: EVENT_CREATE_ORGANIZATION_ID,
        verificationStatus: 'VERIFIED',
      }),
      members: { create: { userId, role: 'ADMIN' } },
    },
  });
};

const createEventCreatorToken = async () => {
  const user = await UserFactory.create();
  await joinEventCreationOrganization(user.id);

  return generateAccessToken(user);
};

describe('/api/v1/events', () => {
  describe('GET /api/v1/events', () => {
    it('should respond with `200` status code', async () => {
      await EventFactory.create(eventListed);

      await request().get(`/api/v1/events/`).send().expect(200);
    });

    it('should show all listed events', async () => {
      await EventFactory.create(eventListed);
      await EventFactory.create(eventListed);

      const { body } = await request()
        .get(`/api/v1/events/`)
        .send()
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(body.data.length).toBe(2);
    });

    it('should only include listed events', async () => {
      await EventFactory.create(eventListed);
      await EventFactory.create(eventUnlisted);

      const { body } = await request().get(`/api/v1/events/`).send();

      expect(body).toHaveProperty('data');
      expect(body.data.length).toBe(1);
    });

    it('should calculate free places', async () => {
      const eventA = await EventFactory.create({
        ...eventListed,
        maxParticipants: 10,
      });
      const eventB = await EventFactory.create({
        ...eventListed,
        countries: ['de', 'fr'],
        maxParticipants: {
          de: 10,
          fr: 5,
        },
      });

      // Create registrations
      await RegistrationFactory.create({
        event: { connect: { id: eventA.id } },
        role: 'participant',
      });
      await RegistrationFactory.create({
        event: { connect: { id: eventA.id } },
        role: 'participant',
      });

      await RegistrationFactory.create({
        event: { connect: { id: eventB.id } },
        role: 'participant',
        country: 'fr',
      });

      const { body } = await request().get(`/api/v1/events/`).send();

      expect(body).toHaveProperty('data');
      expect(body.data.length).toBe(2);

      const eventResultA = body.data.find((v: any) => v.id === eventA.id);
      expect(eventResultA).toHaveProperty('freePlaces', 8);

      const eventResultB = body.data.find((v: any) => v.id === eventB.id);
      expect(eventResultB).toHaveProperty('freePlaces.de', 10);
      expect(eventResultB).toHaveProperty('freePlaces.fr', 4);
    });

    describe('query', () => {
      it('should respond with all events if view is "all" and user is admin', async () => {
        await EventFactory.create(eventListed);
        await EventFactory.create(eventUnlisted);
        await EventFactory.create(eventUnlisted);

        const user = await UserFactory.create({
          role: 'ADMIN',
        });
        const accessToken = generateAccessToken(user);

        const { body } = await request()
          .get(`/api/v1/events/`)
          .query({
            view: 'all',
          })
          .auth(accessToken, { type: 'bearer' })
          .send()
          .expect(200);

        expect(body).toHaveProperty('data');
        expect(body.data.length).toBe(3);
      });

      it('should respond with `401` status code when view is "all" and user is unauthenticated', async () => {
        await EventFactory.create(eventListed);
        await EventFactory.create(eventUnlisted);
        await EventFactory.create(eventUnlisted);

        await request()
          .get(`/api/v1/events/`)
          .query({
            view: 'all',
          })
          .send()
          .expect(401);
      });

      it('should respond with `403` status code when view is "all" and user is not an admin', async () => {
        await EventFactory.create(eventListed);
        await EventFactory.create(eventUnlisted);
        await EventFactory.create(eventUnlisted);

        const user = await UserFactory.create();
        const accessToken = generateAccessToken(user);

        await request()
          .get(`/api/v1/events/`)
          .query({
            view: 'all',
          })
          .auth(accessToken, { type: 'bearer' })
          .send()
          .expect(403);
      });

      it('should respond with `401` status code when view is "assigned" and user is unauthenticated', async () => {
        await EventFactory.create(eventListed);
        await EventFactory.create(eventUnlisted);
        await EventFactory.create(eventUnlisted);

        await request()
          .get(`/api/v1/events/`)
          .query({
            view: 'assigned',
          })
          .send()
          .expect(401);
      });

      it('should respond with assigned events when view is "assigned" and user is not an admin', async () => {
        const event1 = await EventFactory.create(eventUnlisted);
        const event2 = await EventFactory.create(eventUnlisted);
        const event3 = await EventFactory.create(eventUnlisted);
        const event4 = await EventFactory.create(eventUnlisted);
        await EventFactory.create(eventUnlisted);

        const user = await UserFactory.create();
        const otherUser = await UserFactory.create();

        await EventManagerFactory.create({
          event: { connect: { id: event1.id } },
          user: { connect: { id: user.id } },
        });
        await EventManagerFactory.create({
          event: { connect: { id: event2.id } },
          user: { connect: { id: user.id } },
          expiresAt: new Date('2060-01-01'),
        });
        await EventManagerFactory.create({
          event: { connect: { id: event3.id } },
          user: { connect: { id: user.id } },
          expiresAt: new Date('2024-01-01'),
        });
        await EventManagerFactory.create({
          event: { connect: { id: event4.id } },
          user: { connect: { id: otherUser.id } },
        });

        const accessToken = generateAccessToken(user);

        const { body } = await request()
          .get(`/api/v1/events/`)
          .query({
            view: 'assigned',
          })
          .auth(accessToken, { type: 'bearer' })
          .send()
          .expect(200);

        expect(body.data).toHaveLength(2);
        expect(body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: event1.id }),
            expect.objectContaining({ id: event2.id }),
          ]),
        );
      });

      it('should filter by name', async () => {
        const plainMatch = await EventFactory.create({
          ...eventListed,
          name: 'TestEvent',
        });
        const translatedMatch = await EventFactory.create({
          ...eventListed,
          name: {
            de: 'TestEventDE',
            en: 'TestEventEN',
          },
        });
        const plainNonMatch = await EventFactory.create({
          ...eventListed,
          name: 'OtherEvent',
        });
        const translatedNonMatch = await EventFactory.create({
          ...eventListed,
          name: {
            de: 'OtherEventDE',
            en: 'OtherEventEN',
          },
        });

        const { body } = await request()
          .get('/api/v1/events/')
          .query({
            name: 'Test',
          })
          .send()
          .expect(200);

        const ids = body.data.map((event: { id: string }) => event.id);

        expect(body).toHaveProperty('data');
        expect(body.data).toHaveLength(2);
        expect(ids).toEqual(
          expect.arrayContaining([plainMatch.id, translatedMatch.id]),
        );
        expect(ids).not.toEqual(
          expect.arrayContaining([plainNonMatch.id, translatedNonMatch.id]),
        );
      });

      it('should treat name query wildcard characters literally', async () => {
        const literalMatch = await EventFactory.create({
          ...eventListed,
          name: 'Wild_100% Event',
        });
        const wildcardNonMatch = await EventFactory.create({
          ...eventListed,
          name: 'WildA1000 Event',
        });

        const { body } = await request()
          .get('/api/v1/events/')
          .query({
            name: 'Wild_100%',
          })
          .send()
          .expect(200);

        const ids = body.data.map((event: { id: string }) => event.id);

        expect(body).toHaveProperty('data');
        expect(body.data).toHaveLength(1);
        expect(ids).toEqual([literalMatch.id]);
        expect(ids).not.toContain(wildcardNonMatch.id);
      });

      it('should ignore one-character name queries', async () => {
        await EventFactory.create({
          ...eventListed,
          name: 'Alpha Event',
        });
        await EventFactory.create({
          ...eventListed,
          name: 'Beta Event',
        });

        const { body } = await request()
          .get('/api/v1/events/')
          .query({
            name: 'A',
          })
          .send()
          .expect(200);

        expect(body).toHaveProperty('data');
        expect(body.data).toHaveLength(2);
      });

      it('should filter by age', async () => {
        const match = await EventFactory.create({
          ...eventListed,
          minAge: 10,
          maxAge: 14,
        });
        const tooOld = await EventFactory.create({
          ...eventListed,
          minAge: 15,
          maxAge: 18,
        });
        const tooYoung = await EventFactory.create({
          ...eventListed,
          minAge: 6,
          maxAge: 9,
        });

        const { body } = await request()
          .get('/api/v1/events/')
          .query({ age: 12 })
          .send()
          .expect(200);

        const ids = body.data.map((event: { id: string }) => event.id);

        expect(ids).toEqual([match.id]);
        expect(ids).not.toContain(tooOld.id);
        expect(ids).not.toContain(tooYoung.id);
      });

      it('should include events at the edge of the age range', async () => {
        const atMinimum = await EventFactory.create({
          ...eventListed,
          minAge: 12,
          maxAge: 18,
        });
        const atMaximum = await EventFactory.create({
          ...eventListed,
          minAge: 6,
          maxAge: 12,
        });

        const { body } = await request()
          .get('/api/v1/events/')
          .query({ age: 12 })
          .send()
          .expect(200);

        const ids = body.data.map((event: { id: string }) => event.id);

        expect(ids).toEqual(
          expect.arrayContaining([atMinimum.id, atMaximum.id]),
        );
        expect(body.data).toHaveLength(2);
      });

      it('should filter by country', async () => {
        const match = await EventFactory.create({
          ...eventListed,
          countries: ['de'],
        });
        const alsoMatch = await EventFactory.create({
          ...eventListed,
          countries: ['fr', 'de'],
        });
        const nonMatch = await EventFactory.create({
          ...eventListed,
          countries: ['gb'],
        });

        const { body } = await request()
          .get('/api/v1/events/')
          .query({ country: 'de' })
          .send()
          .expect(200);

        const ids = body.data.map((event: { id: string }) => event.id);

        expect(body.data).toHaveLength(2);
        expect(ids).toEqual(expect.arrayContaining([match.id, alsoMatch.id]));
        expect(ids).not.toContain(nonMatch.id);
      });

      it('should match any of several comma-separated countries', async () => {
        const german = await EventFactory.create({
          ...eventListed,
          countries: ['de'],
        });
        const british = await EventFactory.create({
          ...eventListed,
          countries: ['gb'],
        });
        const polish = await EventFactory.create({
          ...eventListed,
          countries: ['pl'],
        });

        const { body } = await request()
          .get('/api/v1/events/')
          .query({ country: 'de,gb' })
          .send()
          .expect(200);

        const ids = body.data.map((event: { id: string }) => event.id);

        expect(body.data).toHaveLength(2);
        expect(ids).toEqual(expect.arrayContaining([german.id, british.id]));
        expect(ids).not.toContain(polish.id);
      });

      it('should keep the status filter when countries are given', async () => {
        // Both clauses need their own slot in the query: an earlier version
        // spread the country condition over the status one and silently
        // dropped it.
        const openGerman = await EventFactory.create({
          ...eventListed,
          countries: ['de'],
          registrationOpensAt: moment().subtract(1, 'week').toDate(),
          registrationClosesAt: moment().add(1, 'week').toDate(),
        });
        const closedGerman = await EventFactory.create({
          ...eventListed,
          countries: ['de'],
          registrationOpensAt: moment().subtract(2, 'week').toDate(),
          registrationClosesAt: moment().subtract(1, 'week').toDate(),
        });

        const { body } = await request()
          .get('/api/v1/events/')
          .query({ country: 'de,gb', status: 'open' })
          .send()
          .expect(200);

        const ids = body.data.map((event: { id: string }) => event.id);

        expect(ids).toEqual([openGerman.id]);
        expect(ids).not.toContain(closedGerman.id);
      });

      it('should reject an unknown country code', async () => {
        await request()
          .get('/api/v1/events/')
          .query({ country: 'germany' })
          .send()
          .expect(400);
      });

      it('should filter by startAt', async () => {
        const match = await EventFactory.create({
          ...eventListed,
          startAt: moment('2026-07-10').toDate(),
          endAt: moment('2026-07-20').toDate(),
        });
        const tooEarly = await EventFactory.create({
          ...eventListed,
          startAt: moment('2026-06-01').toDate(),
          endAt: moment('2026-06-10').toDate(),
        });

        const { body } = await request()
          .get('/api/v1/events/')
          .query({ startAt: moment('2026-07-01').toISOString() })
          .send()
          .expect(200);

        const ids = body.data.map((event: { id: string }) => event.id);

        expect(ids).toEqual([match.id]);
        expect(ids).not.toContain(tooEarly.id);
      });

      it('should filter by endAt', async () => {
        const match = await EventFactory.create({
          ...eventListed,
          startAt: moment('2026-07-10').toDate(),
          endAt: moment('2026-07-20').toDate(),
        });
        const tooLate = await EventFactory.create({
          ...eventListed,
          startAt: moment('2026-07-10').toDate(),
          endAt: moment('2026-08-30').toDate(),
        });

        const { body } = await request()
          .get('/api/v1/events/')
          .query({ endAt: moment('2026-07-31').toISOString() })
          .send()
          .expect(200);

        const ids = body.data.map((event: { id: string }) => event.id);

        expect(ids).toEqual([match.id]);
        expect(ids).not.toContain(tooLate.id);
      });

      it('should only return events falling entirely inside a date range', async () => {
        const inside = await EventFactory.create({
          ...eventListed,
          startAt: moment('2026-07-10').toDate(),
          endAt: moment('2026-07-20').toDate(),
        });
        const overlapping = await EventFactory.create({
          ...eventListed,
          startAt: moment('2026-06-25').toDate(),
          endAt: moment('2026-07-15').toDate(),
        });

        const { body } = await request()
          .get('/api/v1/events/')
          .query({
            startAt: moment('2026-07-01').toISOString(),
            endAt: moment('2026-07-31').toISOString(),
          })
          .send()
          .expect(200);

        const ids = body.data.map((event: { id: string }) => event.id);

        expect(ids).toEqual([inside.id]);
        expect(ids).not.toContain(overlapping.id);
      });

      it('should sort by an allowed column', async () => {
        const cheap = await EventFactory.create({ ...eventListed, price: 10 });
        const expensive = await EventFactory.create({
          ...eventListed,
          price: 500,
        });

        const { body } = await request()
          .get('/api/v1/events/')
          .query({ sortBy: 'price', sortType: 'desc' })
          .send()
          .expect(200);

        const ids = body.data.map((event: { id: string }) => event.id);

        expect(ids).toEqual([expensive.id, cheap.id]);
      });

      it('should reject a sortBy column that is not offered', async () => {
        // sortBy reaches the Prisma orderBy directly on a route anonymous
        // users can call, so it has to be an allow-list.
        await request()
          .get('/api/v1/events/')
          .query({ sortBy: 'organizationId' })
          .send()
          .expect(400);
      });
    });
  });

  describe('GET /api/v1/events/:eventId', () => {
    it('should respond with `200` status code when event is listed', async () => {
      const event = await EventFactory.create({
        listed: true,
        countries: ['de', 'cz'],
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}`)
        .send()
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(body.data).toEqual({
        id: event.id,
        organizationId: event.organizationId,
        organizationName: expect.any(String),
        organizationVerificationStatus: expect.stringMatching(
          /^(PENDING|VERIFIED|REJECTED)$/,
        ),
        confirmationMode: event.confirmationMode,
        listed: event.listed,
        registrationOpensAt: event.registrationOpensAt?.toISOString() ?? null,
        registrationClosesAt: event.registrationClosesAt?.toISOString() ?? null,
        countries: event.countries,
        locales: ['de', 'cs'],
        name: event.name,
        organizer: event.organizer,
        contactEmail: event.contactEmail,
        maxParticipants: event.maxParticipants,
        minAge: event.minAge,
        maxAge: event.maxAge,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt.toISOString(),
        price: event.price,
        location: event.location,
        form: event.form,
        themes: event.themes,
        freePlaces: expect.anything(),
        registrationStatus: eventRegistrationStatus(event),
      });
    });

    it('should respond with `200` status code when event is private', async () => {
      const event = await EventFactory.create({
        listed: false,
      });

      await request().get(`/api/v1/events/${event.id}`).send().expect(200);
    });

    describe('unverified organization', () => {
      // A private event stays reachable by link, but one owned by an unvetted
      // entity does not: its managers are the only audience.
      const unverifiedEvent = {
        ...eventListed,
        organization: {
          create: OrganizationFactory.build({
            verificationStatus: 'PENDING' as const,
          }),
        },
      };

      it('should respond with `401` status code when unauthenticated', async () => {
        const event = await EventFactory.create(unverifiedEvent);

        await request().get(`/api/v1/events/${event.id}`).send().expect(401);
      });

      it('should respond with `403` status code when user does not manage the event', async () => {
        const event = await EventFactory.create(unverifiedEvent);
        const accessToken = await createEventCreatorToken();

        await request()
          .get(`/api/v1/events/${event.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(403);
      });

      it('should respond with `200` status code when user manages the event', async () => {
        const { event, accessToken } =
          await createEventWithManagerAndToken(unverifiedEvent);

        await request()
          .get(`/api/v1/events/${event.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(200);
      });
    });

    describe('free places', () => {
      it('should calculate free places for national events', async () => {
        const event = await EventFactory.create({
          ...eventListed,
          maxParticipants: 10,
        });

        // Create registrations
        await RegistrationFactory.create({
          event: { connect: { id: event.id } },
          role: 'participant',
        });
        await RegistrationFactory.create({
          event: { connect: { id: event.id } },
          role: 'participant',
        });
        await RegistrationFactory.create({
          event: { connect: { id: event.id } },
          role: 'counselor',
        });

        const { body } = await request()
          .get(`/api/v1/events/${event.id}`)
          .send()
          .expect(200);

        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('freePlaces', 8);
        expect(body.data).toHaveProperty('maxParticipants', 10);
      });

      it('should calculate free places for international events', async () => {
        const event = await EventFactory.create({
          ...eventListed,
          countries: ['de', 'fr'],
          maxParticipants: {
            de: 8,
            fr: 6,
          },
        });

        // Create registrations
        await RegistrationFactory.create({
          event: { connect: { id: event.id } },
          role: 'participant',
          country: 'de',
        });
        await RegistrationFactory.create({
          event: { connect: { id: event.id } },
          role: 'participant',
          country: 'fr',
        });
        await RegistrationFactory.create({
          event: { connect: { id: event.id } },
          role: 'counselor',
          country: 'fr',
        });

        const { body } = await request()
          .get(`/api/v1/events/${event.id}`)
          .send()
          .expect(200);

        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('freePlaces.de', 7);
        expect(body.data).toHaveProperty('freePlaces.fr', 5);
        expect(body.data).toHaveProperty('maxParticipants.de', 8);
        expect(body.data).toHaveProperty('maxParticipants.fr', 6);
      });
    });

    it('should respond with `200` status code for any authenticated user regardless of registration window', async () => {
      const event = await EventFactory.create({
        registrationClosesAt: new Date('2020-01-01'),
      });
      const accessToken = await createEventCreatorToken();

      await request()
        .get(`/api/v1/events/${event.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);
    });

    it('should respond with `200` status code for unauthenticated users regardless of registration window', async () => {
      const event = await EventFactory.create({
        registrationClosesAt: new Date('2020-01-01'),
      });

      await request().get(`/api/v1/events/${event.id}`).send().expect(200);
    });

    it('should respond with `404` status code when event id does not exists', async () => {
      const eventId = ulid();

      await request().get(`/api/v1/events/${eventId}`).send().expect(404);
    });
  });

  describe('POST /api/v1/events', () => {
    const assertEventCreated = async (
      data: Omit<EventCreateData, 'confirmationMode'> & {
        confirmationMode?: string;
      },
      locales: string[],
      actual: unknown,
    ) => {
      // Test response
      assertEventResponseBody(
        {
          ...(data as EventCreateData),
          locales,
        },
        actual,
      );

      const id = (actual as { data: { id: string } }).data.id;
      await assertEventModel(id, data as EventCreateData);
    };

    it('should respond with `201` status code when user is authenticated', async () => {
      const accessToken = await createEventCreatorToken();
      const data = eventCreateNational;

      const { body } = await request()
        .post(`/api/v1/events/`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      // Test response
      await assertEventCreated(data, ['de'], body);
    });

    it('should respond with `201` status code with international event', async () => {
      const accessToken = await createEventCreatorToken();

      const data = eventCreateInternational;

      const { body } = await request()
        .post(`/api/v1/events/`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      // Test response
      await assertEventCreated(data, ['de', 'fr'], body);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      await request().post(`/api/v1/events/`).send().expect(401);
    });

    it('should have no registration window by default', async () => {
      const accessToken = await createEventCreatorToken();

      const { body } = await request()
        .post(`/api/v1/events/`)
        .send(eventCreateNational)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data.registrationOpensAt', null);
      expect(body).toHaveProperty('data.registrationClosesAt', null);
    });

    describe('invalid request body', () => {
      it.each(eventCreatedBody)(
        'should validate the request body | $name',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async ({ data, expected }) => {
          const accessToken = await createEventCreatorToken();

          await request()
            .post(`/api/v1/events/`)
            .send(data)
            .auth(accessToken, { type: 'bearer' })
            .expect(expected);
        },
      );
    });

    describe('defaults', () => {
      it('should set default form', async () => {
        const accessToken = await createEventCreatorToken();

        const { body } = await request()
          .post(`/api/v1/events/`)
          .send(eventCreateNational)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        expect(body.data.form).toHaveProperty('title');
      });

      it('should create default table templates', async () => {
        const accessToken = await createEventCreatorToken();

        const { body } = await request()
          .post(`/api/v1/events/`)
          .send(eventCreateNational)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        const templates = await prisma.tableTemplate.findMany({
          where: {
            event: { id: body.data.id },
          },
        });

        expect(templates.length).not.toBe(0);
      });

      describe('message templates', () => {
        it('should create default message templates', async () => {
          const accessToken = await createEventCreatorToken();

          const { body } = await request()
            .post(`/api/v1/events/`)
            .send(eventCreateNational)
            .auth(accessToken, { type: 'bearer' })
            .expect(201);

          const templates = await prisma.messageTemplate.findMany({
            where: {
              event: { id: body.data.id },
            },
          });

          expect(templates.length).not.toBe(0);
        });

        it('should create default message templates when country code does not match language', async () => {
          const accessToken = await createEventCreatorToken();

          const { body } = await request()
            .post(`/api/v1/events/`)
            .send({
              ...eventCreateNational,
              countries: ['cz'],
            })
            .auth(accessToken, { type: 'bearer' })
            .expect(201);

          const templates = await prisma.messageTemplate.findMany({
            where: {
              event: { id: body.data.id },
            },
          });

          expect(templates.length).not.toBe(0);
        });

        it('should filter message template languages based on event countries', async () => {
          const accessToken = await createEventCreatorToken();

          const { body } = await request()
            .post(`/api/v1/events/`)
            .send({
              ...eventCreateNational,
              // Use Czech Republic to test that 'cs' is included (not 'cz')
              countries: ['de', 'cz'],
            })
            .auth(accessToken, { type: 'bearer' })
            .expect(201);

          const templates = await prisma.messageTemplate.findMany({
            where: {
              event: { id: body.data.id },
            },
          });

          expect(templates.length).not.toBe(0);

          for (const template of templates) {
            expect(template.country).toBeOneOf(['de', 'cz']);
          }
        });
      });
    });

    describe('reference id', () => {
      it('should copy the form of the referenced event', async () => {
        const referenceForm = {
          title: 'Reference event title',
        };
        const { event: referenceEvent, accessToken } =
          await createEventWithManagerAndToken({ form: referenceForm });

        const data = {
          ...eventCreateNational,
          referenceEventId: referenceEvent.id,
        };

        const { body } = await request()
          .post(`/api/v1/events/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expectOrPrint(201);

        expect(body.data.form).toStrictEqual(referenceForm);
      });

      it('should copy the themes of the referenced event', async () => {
        const referenceThemes = {
          light: { themeName: 'Test' },
        };
        const { event: referenceEvent, accessToken } =
          await createEventWithManagerAndToken({ themes: referenceThemes });

        const data = {
          ...eventCreateNational,
          referenceEventId: referenceEvent.id,
        };

        const { body } = await request()
          .post(`/api/v1/events/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        expect(body.data.themes).toStrictEqual(referenceThemes);
      });

      it('should copy all table templates from the referenced event', async () => {
        const { event: referenceEvent, accessToken } =
          await createEventWithManagerAndToken();
        await TableTemplateFactory.create({
          event: { connect: { id: referenceEvent.id } },
          data: {
            title: 'Template 1',
            columns: [],
          },
        });
        await TableTemplateFactory.create({
          event: { connect: { id: referenceEvent.id } },
          data: {
            title: 'Template 2',
            columns: [],
          },
        });

        const data = {
          ...eventCreateNational,
          referenceEventId: referenceEvent.id,
        };

        const { body } = await request()
          .post(`/api/v1/events/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        const templates = await prisma.tableTemplate.findMany({
          where: {
            event: { id: body.data.id },
          },
        });

        expect(templates.length).toBe(2);
        expect(
          templates.some((value) => value.data.title === 'Template 1'),
        ).toBeTruthy();
        expect(
          templates.some((value) => value.data.title === 'Template 2'),
        ).toBeTruthy();
      });

      it('should copy all message templates from the referenced event', async () => {
        const { event: referenceEvent, accessToken } =
          await createEventWithManagerAndToken({
            messageTemplates: {},
          });

        await MessageTemplateFactory.create({
          event: { connect: { id: referenceEvent.id } },
          event: 'registration_confirmed',
        });
        await MessageTemplateFactory.create({
          event: { connect: { id: referenceEvent.id } },
          event: 'registration_waitlist_accepted',
        });

        const data = {
          ...eventCreateNational,
          referenceEventId: referenceEvent.id,
        };

        const { body } = await request()
          .post(`/api/v1/events/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        const templates = await prisma.messageTemplate.findMany({
          where: {
            event: { id: body.data.id },
          },
        });

        expect(templates.length).toBe(2);
        expect(
          templates.some((value) => value.event === 'registration_confirmed'),
        ).toBeTruthy();
        expect(
          templates.some(
            (value) => value.event === 'registration_waitlist_accepted',
          ),
        ).toBeTruthy();
      });

      it('should copy all files from the referenced event', async () => {
        const { event: referenceEvent, accessToken } =
          await createEventWithManagerAndToken();
        await FileFactory.create({
          event: { connect: { id: referenceEvent.id } },
          originalName: 'File 1',
        });
        await FileFactory.create({
          event: { connect: { id: referenceEvent.id } },
          originalName: 'File 2',
        });

        const data = {
          ...eventCreateNational,
          referenceEventId: referenceEvent.id,
        };

        const { body } = await request()
          .post(`/api/v1/events/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        const files = await prisma.file.findMany({
          where: {
            event: { id: body.data.id },
          },
        });

        expect(files.length).toBe(2);
        expect(
          files.some((value) => value.originalName === 'File 1'),
        ).toBeTruthy();
        expect(
          files.some((value) => value.originalName === 'File 2'),
        ).toBeTruthy();
      });

      it('should replace file URLs in the form', async () => {
        const fileUrl = (id: string): string => {
          return `http://localhost:3000/files/${id}`;
        };

        const createForm = (fileId1: string, fileId2: string) => {
          return {
            logo: { default: fileUrl(fileId1) },
            questions: [
              { title: `This is [markdown](${fileUrl(fileId2)})` },
              { title: `And another [markdown](${fileUrl(fileId2)}) link` },
              { title: `Url with [query](${fileUrl(fileId2)}?test=yes)` },
              { title: 'External [link](https://test.net) link' },
            ],
          };
        };

        const fileId1 = ulid();
        const fileId2 = ulid();
        const form = createForm(fileId1, fileId2);

        const { event: referenceEvent, accessToken } =
          await createEventWithManagerAndToken({ form });

        await FileFactory.create({
          id: fileId1,
          event: { connect: { id: referenceEvent.id } },
          originalName: 'File 1',
        });
        await FileFactory.create({
          id: fileId2,
          event: { connect: { id: referenceEvent.id } },
          originalName: 'File 2',
        });

        const data = {
          ...eventCreateNational,
          referenceEventId: referenceEvent.id,
        };

        const { body } = await request()
          .post(`/api/v1/events/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(201);

        const newFile1 = await prisma.file.findFirst({
          where: {
            event: { id: body.data.id },
            originalName: 'File 1',
          },
        });
        const newFile2 = await prisma.file.findFirst({
          where: {
            event: { id: body.data.id },
            originalName: 'File 2',
          },
        });

        expect(newFile1).not.toBeNull();
        expect(newFile2).not.toBeNull();
        expect(body.data.form).toStrictEqual(
          createForm(newFile1!.id, newFile2!.id),
        );
      });

      it('should respond with `400` status code when the reference event countries do not match', async () => {
        const { event: referenceEvent, accessToken } =
          await createEventWithManagerAndToken({ countries: ['fr'] });

        const data = {
          ...eventCreateNational,
          countries: ['de'],
          referenceEventId: referenceEvent.id,
        };

        await request()
          .post(`/api/v1/events/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(400);
      });

      it('should respond with `403` status code when user does not manage the reference event', async () => {
        const accessToken = await createEventCreatorToken();
        const event = await EventFactory.create();

        const data = {
          ...eventCreateNational,
          referenceEventId: event.id,
        };

        await request()
          .post(`/api/v1/events/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(403);
      });

      it('should respond with `403` status code when reference event does not exist', async () => {
        const accessToken = await createEventCreatorToken();

        const data = {
          ...eventCreateNational,
          referenceEventId: ulid(),
        };

        await request()
          .post(`/api/v1/events/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(403);
      });
    });
  });

  describe('PATCH /api/v1/events/:eventId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          {},
          role,
        );

        const data = {
          confirmationMode: 'AUTOMATIC' as const,
          registrationOpensAt: null,
          registrationClosesAt: null,
          listed: false,
          name: 'Test Event',
          organizer: 'Test Org',
          contactEmail: 'test@example.com',
          maxParticipants: 10,
          minAge: 10,
          maxAge: 15,
          startAt: moment()
            .add('20 days')
            .startOf('hour')
            .toDate()
            .toISOString(),
          endAt: moment().add('22 days').startOf('hour').toDate().toISOString(),
          price: 100.0,
          location: 'Somewhere',
          form: {},
          themes: {},
        };

        const response = await request()
          .patch(`/api/v1/events/${event.id}`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 200) {
          // Countries are immutable - the update leaves them untouched.
          const expected = { ...data, countries: event.countries };

          // Test response
          assertEventResponseBody(
            {
              ...expected,
              locales: [...new Set(countriesToLocales(event.countries))],
            },
            response.body,
          );

          // Test model
          await assertEventModel(event.id, expected);
        }
      },
    );

    it('should update event data for all registrations', async () => {
      const { event, accessToken } =
        await createEventWithManagerAndToken(eventWithForm);

      const names = ['John', 'Tom', 'Marry'];

      for (const name of names) {
        await RegistrationFactory.create({
          event: { connect: { id: event.id } },
          data: {
            first_name: name,
            email: `${name}@example.com`,
            role: 'participant',
          },
          role: 'participant',
          firstName: name,
        });
      }

      await request()
        .patch(`/api/v1/events/${event.id}`)
        .send(eventUpdateBodyWithForm)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const registrations = await prisma.registration.findMany({
        where: {
          event: { id: event.id },
        },
      });

      for (const name of names) {
        const registration = registrations.find(
          (r) => r.data.first_name === name,
        );
        expect(registration).toHaveProperty('firstName', name);
        expect(registration).toHaveProperty('role', null);
        expect(registration).toHaveProperty(
          'emails',
          expect.arrayContaining([`${name}@example.com`]),
        );
      }
    });

    it('should update the free places when max participant change', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken(
        eventWithMaxParticipantsRolesInternational,
      );
      // Normal registrations
      await RegistrationFactory.create({
        event: { connect: { id: event.id } },
        country: 'fr',
        role: 'participant',
      });
      await RegistrationFactory.create({
        event: { connect: { id: event.id } },
        country: 'fr',
        role: 'participant',
      });
      // Counselor should not influence free places
      await RegistrationFactory.create({
        event: { connect: { id: event.id } },
        country: 'fr',
        role: 'counselor',
      });

      const dataA = {
        maxParticipants: 10,
      };

      const { body: bodyA } = await request()
        .patch(`/api/v1/events/${event.id}`)
        .send(dataA)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(bodyA).toHaveProperty('data.freePlaces', 8);

      const dataB = {
        maxParticipants: {
          de: 5,
          fr: 10,
        },
      };

      const { body: bodyB } = await request()
        .patch(`/api/v1/events/${event.id}`)
        .send(dataB)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(bodyB).toHaveProperty('data.freePlaces', {
        de: 5,
        fr: 8,
      });
    });

    it('should delete the mails rendered for the event', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken(
        {},
        'DIRECTOR',
      );
      const registration = await RegistrationFactory.create({
        event: { connect: { id: event.id } },
      });
      await MessageDeliveryFactory.create({
        registration: { connect: { id: registration.id } },
      });

      await request()
        .delete(`/api/v1/events/${event.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      // Deleting a event is the retention action the reminder mail asks for. It
      // used to leave every rendered body behind, orphaned and unreachable —
      // the cascade now runs event → registration → delivery.
      const deliveries = await prisma.messageDelivery.count();
      expect(deliveries).toBe(0);
    });

    it('should respond with `403` status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const accessToken = await createEventCreatorToken();

      await request()
        .patch(`/api/v1/events/${event.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request().patch(`/api/v1/events/${event.id}`).send().expect(401);
    });

    it('should respond with `404` status code when event id does not exists', async () => {
      const accessToken = await createEventCreatorToken();
      const eventId = ulid();
      const data = {
        listed: true,
      };

      await request()
        .patch(`/api/v1/events/${eventId}`)
        .send(data)
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    describe('request body', () => {
      it.each(eventUpdateBody)(
        'should validate the request body | $name',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async ({ data, event: eventData, expected }) => {
          const eventCreateInput = {
            ...eventInputNational,
            ...eventData,
          };

          const { event, accessToken } =
            await createEventWithManagerAndToken(eventCreateInput);

          await request()
            .patch(`/api/v1/events/${event.id}`)
            .send(data)
            .auth(accessToken, { type: 'bearer' })
            .expect(expected);
        },
      );
    });
  });

  describe('DELETE /api/v1/events/:eventId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 204 },
      { role: 'COORDINATOR', expectedStatus: 403 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } = await createEventWithManagerAndToken(
          {},
          role,
        );
        const otherEvent = await EventFactory.create();

        await request()
          .delete(`/api/v1/events/${event.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 204) {
          const eventCount = await prisma.event.count();
          expect(eventCount).toBe(1);

          const remainingEvent = await prisma.event.findFirst();
          expect(remainingEvent?.id).toBe(otherEvent.id);
        } else {
          const eventCount = await prisma.event.count();
          expect(eventCount).toBe(2);
        }
      },
    );

    it('should respond with `403` status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const accessToken = await createEventCreatorToken();

      await request()
        .delete(`/api/v1/events/${event.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const eventCount = await prisma.event.count();
      expect(eventCount).toBe(1);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request().delete(`/api/v1/events/${event.id}`).send().expect(401);

      const eventCount = await prisma.event.count();
      expect(eventCount).toBe(1);
    });

    it('should respond with `404` status code when event id does not exists', async () => {
      const accessToken = await createEventCreatorToken();
      const eventId = ulid();

      await request()
        .delete(`/api/v1/events/${eventId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it.todo('should delete all files');
  });

  describe('PATCH /api/v1/events/:eventId/organization', () => {
    it('should keep the event listed when moving it to an unverified organization', async () => {
      // Visibility follows the new owner's moderation status on read; the
      // event's own flag is the organization's to set, and only a rejection
      // takes it away.
      const event = await EventFactory.create(eventListed);
      const organization = await OrganizationFactory.create({
        verificationStatus: 'PENDING',
      });
      const admin = await UserFactory.create({ role: 'ADMIN' });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/organization`)
        .send({ organizationId: organization.id })
        .auth(generateAccessToken(admin), { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.listed', true);

      const movedEvent = await prisma.event.findFirst({
        where: { id: event.id },
      });
      expect(movedEvent?.listed).toBe(true);
      expect(movedEvent?.organizationId).toBe(organization.id);
    });

    it('should drop the event from the listing while the new organization is unverified', async () => {
      const event = await EventFactory.create(eventListed);
      const organization = await OrganizationFactory.create({
        verificationStatus: 'PENDING',
      });
      const admin = await UserFactory.create({ role: 'ADMIN' });

      await request()
        .patch(`/api/v1/events/${event.id}/organization`)
        .send({ organizationId: organization.id })
        .auth(generateAccessToken(admin), { type: 'bearer' })
        .expect(200);

      const { body } = await request()
        .get(`/api/v1/events/`)
        .send()
        .expect(200);

      expect(body.data).toHaveLength(0);
    });
  });
});
