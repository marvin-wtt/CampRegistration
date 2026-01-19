import { BaseSeeder } from './BaseSeeder';
import { RegistrationFactory } from '../factories';

class RegistrationSeeder extends BaseSeeder {
  name(): string {
    return 'registration';
  }

  async run(): Promise<void> {
    for (let i = 0; i < 50; i++) {
      await RegistrationFactory.create({
        camp: { connect: { id: '01K9ATF1H9KD1K6H12F3YK8RWR' } },
      });
    }
  }
}

export default new RegistrationSeeder();
