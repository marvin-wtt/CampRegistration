import { UserFactory } from '../factories';
import { BaseSeeder } from './BaseSeeder';
import { SEED_ADMIN_PASSWORD, SEED_PASSWORD, USER_IDS } from './ids';

class UserSeeder extends BaseSeeder {
  name(): string {
    return 'user';
  }

  async run(): Promise<void> {
    // The account every scenario is built around.
    await UserFactory.create({
      id: USER_IDS.john,
      name: 'John Doe',
      email: 'john@example.com',
      password: SEED_PASSWORD,
      emailVerified: true,
    });

    await UserFactory.create({
      id: USER_IDS.admin,
      name: 'Admin User',
      email: 'admin@email.com',
      password: SEED_ADMIN_PASSWORD,
      emailVerified: true,
      twoFactor: {
        create: {
          secret: 'TMRUI6PADI7DGPJF5DPMLCWSXW32MKXM',
          confirmedAt: new Date(),
        },
      },
      role: 'ADMIN',
    });

    // Colleagues, so no manager or member list is ever a single row. Same
    // password as John — log in as one to see the same event from another role.
    await UserFactory.create({
      id: USER_IDS.erika,
      name: 'Erika Mustermann',
      email: 'erika@example.com',
      password: SEED_PASSWORD,
      emailVerified: true,
      locale: 'de-DE',
    });

    await UserFactory.create({
      id: USER_IDS.peter,
      name: 'Peter Novák',
      email: 'peter@example.com',
      password: SEED_PASSWORD,
      emailVerified: true,
      locale: 'cs-CZ',
    });

    await UserFactory.create({
      id: USER_IDS.maria,
      name: 'Marie Dupont',
      email: 'maria@example.com',
      password: SEED_PASSWORD,
      emailVerified: true,
      locale: 'fr-FR',
    });

    await UserFactory.create({
      id: USER_IDS.tom,
      name: 'Tom Harbour',
      email: 'tom@example.com',
      password: SEED_PASSWORD,
      emailVerified: true,
    });

    // Edge cases for the administration user list.
    await UserFactory.create({
      id: USER_IDS.locked,
      name: 'Locked Account',
      email: 'locked@example.com',
      password: SEED_PASSWORD,
      emailVerified: true,
      locked: true,
    });

    await UserFactory.create({
      id: USER_IDS.unverified,
      name: 'Unverified Account',
      email: 'unverified@example.com',
      password: SEED_PASSWORD,
      emailVerified: false,
    });
  }
}

export default new UserSeeder();
