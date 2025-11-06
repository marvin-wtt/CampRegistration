import { BaseSeeder } from './BaseSeeder';
import { CampManagerFactory } from '../factories';

class CampManagerSeeder extends BaseSeeder {
  name(): string {
    return 'manager';
  }

  async run(): Promise<void> {
    await CampManagerFactory.create({
      user: { connect: { id: '01H4BK7J4WV75DZNAQBHMM99MA' } },
      camp: { connect: { id: '01JHP0CXJFR4MQS8SF1HQJCY38' } },
    });

    await CampManagerFactory.create({
      user: { connect: { id: '01H4BK7J4WV75DZNAQBHMM99MA' } },
      camp: { connect: { id: '01JKEMXG5C62NBMA6V0QQDJ7JD' } },
    });

    await CampManagerFactory.create({
      user: { connect: { id: '01H4BK7J4WV75DZNAQBHMM99MA' } },
      camp: { connect: { id: '01K9ATF1H9KD1K6H12F3YK8RWR' } },
    });
  }
}

export default new CampManagerSeeder();
