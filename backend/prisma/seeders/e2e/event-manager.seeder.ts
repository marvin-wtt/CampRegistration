import { EventManagerFactory } from '../../factories';
import {
  E2E_GROUP_CLOSED_EVENT_ID,
  E2E_GROUP_EVENT_ID,
} from './event.seeder.js';
import { E2E_ROLE_USERS } from './user.seeder.js';

export async function seedE2eEventManagers(): Promise<void> {
  for (const role of ['COORDINATOR', 'COUNSELOR', 'VIEWER'] as const) {
    await EventManagerFactory.create({
      role,
      user: { connect: { id: E2E_ROLE_USERS[role] } },
      event: { connect: { id: '01JHP0CXJFR4MQS8SF1HQJCY38' } },
    });
  }

  await EventManagerFactory.create({
    user: { connect: { id: '01H4BK7J4WV75DZNAQBHMM99MA' } },
    event: { connect: { id: '01JHP0CXJFR4MQS8SF1HQJCY38' } },
  });

  await EventManagerFactory.create({
    user: { connect: { id: '01H4BK7J4WV75DZNAQBHMM99MA' } },
    event: { connect: { id: '01JKEMXG5C62NBMA6V0QQDJ7JD' } },
  });

  await EventManagerFactory.create({
    user: { connect: { id: '01H4BK7J4WV75DZNAQBHMM99MA' } },
    event: { connect: { id: E2E_GROUP_EVENT_ID } },
  });

  // Lets the visual suite show the closed page's form override.
  await EventManagerFactory.create({
    user: { connect: { id: '01H4BK7J4WV75DZNAQBHMM99MA' } },
    event: { connect: { id: E2E_GROUP_CLOSED_EVENT_ID } },
  });
}
