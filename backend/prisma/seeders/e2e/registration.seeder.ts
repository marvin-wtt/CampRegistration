import { RegistrationFactory } from '../../factories';

export async function seedE2eRegistrations(): Promise<void> {
  await RegistrationFactory.create({
    firstName: 'Tom',
    lastName: 'Smith',
    emails: ['tom.smith@example.com'],
    status: 'ACCEPTED',
    camp: { connect: { id: '01JHP0CXJFR4MQS8SF1HQJCY38' } },
  });
}
