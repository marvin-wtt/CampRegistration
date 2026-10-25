import { EventFactory } from '../../factories';
import { E2E_ORGANIZATION_ID } from './organization.seeder.js';

// The factory fills unset fields with faker data, which changes on every
// reseed. Anything the event page renders — the contact email in particular —
// must be pinned here, or the visual baselines would drift on every run.
export async function seedE2eEvents(): Promise<void> {
  await EventFactory.create({
    id: '01JHP0CXJFR4MQS8SF1HQJCY38',
    name: 'Simple Event',
    listed: true,
    organization: { connect: { id: E2E_ORGANIZATION_ID } },
    contactEmail: 'simple-event@example.com',
    form: {
      name: 'Simple test event',
      description: 'Event without special fields or translations',
      elements: [
        {
          name: 'first_name',
          type: 'text',
          required: true,
        },
        {
          name: 'last_name',
          type: 'text',
          required: true,
        },
      ],
    },
  });

  await EventFactory.create({
    id: '01JKEMXG5C62NBMA6V0QQDJ7JD',
    name: 'Files Event',
    listed: true,
    organization: { connect: { id: E2E_ORGANIZATION_ID } },
    contactEmail: 'files-event@example.com',
    registrationOpensAt: '2025-11-05T20:13:53.577Z',
    form: {
      name: 'Files test event',
      description: 'Event without special fields or translations',
      elements: [
        {
          name: 'first_name',
          type: 'text',
          required: true,
        },
        {
          name: 'files',
          type: 'file',
          required: true,
          allowMultiple: true,
        },
      ],
    },
  });

  // Registration window opens in the far future -> "upcoming" status.
  await EventFactory.create({
    id: '01JHP0CXJFR4MQS8SF1HQJCA10',
    name: 'Upcoming Event',
    listed: true,
    organization: { connect: { id: E2E_ORGANIZATION_ID } },
    contactEmail: 'upcoming-event@example.com',
    registrationOpensAt: '2999-01-01T09:00:00.000Z',
    registrationClosesAt: null,
    form: { name: 'Upcoming event', elements: [] },
  });

  // Registration window already ended -> "closed" status.
  await EventFactory.create({
    id: '01JHP0CXJFR4MQS8SF1HQJCA20',
    name: 'Closed Event',
    listed: true,
    organization: { connect: { id: E2E_ORGANIZATION_ID } },
    contactEmail: 'closed-event@example.com',
    registrationOpensAt: null,
    registrationClosesAt: '2020-06-01T09:00:00.000Z',
    form: { name: 'Closed event', elements: [] },
  });

  // Two groups, chosen before the form. Unlisted, so the listing baselines
  // don't change. The address is strict (the default), the nationality warns.
  await EventFactory.create({
    id: E2E_GROUP_EVENT_ID,
    name: 'Group Event',
    listed: false,
    organization: { connect: { id: E2E_ORGANIZATION_ID } },
    contactEmail: 'group-event@example.com',
    // Shown on the group choice, which has a visual baseline.
    startAt: '2027-07-01T09:00:00.000Z',
    endAt: '2027-07-14T17:00:00.000Z',
    location: 'Lakeside Camp',
    countries: ['de', 'fr'],
    maxParticipants: { de: 10, fr: 10 },
    registrationClosesAt: null,
    form: {
      name: 'Group test event',
      elements: [
        { name: 'first_name', type: 'text', isRequired: true },
        {
          name: 'address',
          type: 'address',
          eventDataType: 'address',
          isRequired: true,
        },
        { name: 'nationality', type: 'country', groupCountryMatch: 'warn' },
      ],
    },
  });

  // The French group is full, so a registration for it goes on the waiting
  // list. Fixed subjects, so the test can tell which message arrived.
  await EventFactory.create({
    id: E2E_WAITLIST_EVENT_ID,
    name: 'Waitlist Event',
    listed: false,
    organization: { connect: { id: E2E_ORGANIZATION_ID } },
    contactEmail: 'waitlist-event@example.com',
    countries: ['de', 'fr'],
    maxParticipants: { de: 10, fr: 0 },
    registrationClosesAt: null,
    form: {
      name: 'Waitlist test event',
      elements: [
        { name: 'first_name', type: 'text', isRequired: true },
        {
          name: 'email',
          type: 'text',
          inputType: 'email',
          eventDataType: 'email',
          isRequired: true,
        },
      ],
    },
    messageTemplates: {
      create: [
        {
          trigger: 'registration_waitlisted',
          country: 'fr',
          subject: 'Waiting list France',
          body: 'You are on the waiting list.',
        },
        {
          trigger: 'registration_confirmed',
          country: 'fr',
          subject: 'Confirmed France',
          body: 'You are registered.',
        },
      ],
    },
  });
}

export const E2E_GROUP_EVENT_ID = '01JHP0CXJFR4MQS8SF1HQJCG01';
export const E2E_WAITLIST_EVENT_ID = '01JHP0CXJFR4MQS8SF1HQJCW01';
