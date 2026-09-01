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
}
