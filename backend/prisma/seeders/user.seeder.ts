import { UserFactory } from '../factories';
import { BaseSeeder } from './BaseSeeder';

class UserSeeder extends BaseSeeder {
  name(): string {
    return 'user';
  }

  async run(): Promise<void> {
    await UserFactory.create({
      id: '01H4BK7J4WV75DZNAQBHMM99MA',
      name: 'John Doe',
      email: 'john@example.com',
      password: '$2a$12$6xNRDn8nlpzoXcjCXoa6uuiOcnINPbKRKVFaxO3lzLC4uXJhB5DAC', // hashed password for 'password'
      emailVerified: true,
    });

    await UserFactory.create({
      id: '',
      name: 'Admin User',
      email: 'admin@email.com',
      password: 'admin-password',
      emailVerified: true,
      role: 'ADMIN',
    });
  }
}

export default new UserSeeder();
