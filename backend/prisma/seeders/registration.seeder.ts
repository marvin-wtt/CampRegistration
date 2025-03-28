import { BaseSeeder } from './BaseSeeder';

class RegistrationSeeder extends BaseSeeder {
  name(): string {
    return 'registration';
  }

  run(): Promise<void> {
    return Promise.resolve();
  }
}

export default new RegistrationSeeder();
