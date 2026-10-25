import { RegistrationFactory } from '../../factories';
import { E2E_GROUP_EVENT_ID } from './event.seeder.js';

export async function seedE2eRegistrations(): Promise<void> {
  await RegistrationFactory.create({
    firstName: 'Tom',
    lastName: 'Smith',
    emails: ['tom.smith@example.com'],
    status: 'ACCEPTED',
    event: { connect: { id: '01JHP0CXJFR4MQS8SF1HQJCY38' } },
  });

  // For moving a registration to the other group.
  await RegistrationFactory.create({
    firstName: 'Lena',
    lastName: 'Weber',
    emails: ['lena.weber@example.com'],
    status: 'ACCEPTED',
    group: 'de',
    country: 'de',
    event: { connect: { id: E2E_GROUP_EVENT_ID } },
  });
}
