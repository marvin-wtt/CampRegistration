import { CampFactory } from '../../factories';

// The factory fills unset fields with faker data, which changes on every
// reseed. Anything the camp page renders — the contact email in particular —
// must be pinned here, or the visual baselines would drift on every run.
export async function seedE2eCamps(): Promise<void> {
  await CampFactory.create({
    id: '01JHP0CXJFR4MQS8SF1HQJCY38',
    name: 'Simple Camp',
    public: true,
    contactEmail: 'simple-camp@example.com',
    form: {
      name: 'Simple test camp',
      description: 'Camp without special fields or translations',
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

  await CampFactory.create({
    id: '01JKEMXG5C62NBMA6V0QQDJ7JD',
    name: 'Files Camp',
    public: true,
    contactEmail: 'files-camp@example.com',
    registrationOpensAt: '2025-11-05T20:13:53.577Z',
    form: {
      name: 'Files test camp',
      description: 'Camp without special fields or translations',
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
  await CampFactory.create({
    id: '01JHP0CXJFR4MQS8SF1HQJCA10',
    name: 'Upcoming Camp',
    public: true,
    contactEmail: 'upcoming-camp@example.com',
    registrationOpensAt: '2999-01-01T09:00:00.000Z',
    registrationClosesAt: null,
    form: { name: 'Upcoming camp', elements: [] },
  });

  // Registration window already ended -> "closed" status.
  await CampFactory.create({
    id: '01JHP0CXJFR4MQS8SF1HQJCA20',
    name: 'Closed Camp',
    public: true,
    contactEmail: 'closed-camp@example.com',
    registrationOpensAt: null,
    registrationClosesAt: '2020-06-01T09:00:00.000Z',
    form: { name: 'Closed camp', elements: [] },
  });
}
