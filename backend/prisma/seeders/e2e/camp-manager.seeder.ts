import { CampManagerFactory } from '../../factories';

export async function seedE2eCampManagers(): Promise<void> {
  await CampManagerFactory.create({
    user: { connect: { id: '01H4BK7J4WV75DZNAQBHMM99MA' } },
    camp: { connect: { id: '01JHP0CXJFR4MQS8SF1HQJCY38' } },
  });

  await CampManagerFactory.create({
    user: { connect: { id: '01H4BK7J4WV75DZNAQBHMM99MA' } },
    camp: { connect: { id: '01JKEMXG5C62NBMA6V0QQDJ7JD' } },
  });
}
