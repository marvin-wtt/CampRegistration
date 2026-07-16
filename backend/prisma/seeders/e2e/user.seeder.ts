import { UserFactory } from '../../factories';

export async function seedE2eUsers(): Promise<void> {
  await UserFactory.create({
    id: '01H4BK7J4WV75DZNAQBHMM99MA',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password',
    emailVerified: true,
  });

  await UserFactory.create({
    name: 'Admin User',
    email: 'admin@email.com',
    password: 'admin-password',
    emailVerified: true,
    twoFactor: {
      create: {
        secret: 'TMRUI6PADI7DGPJF5DPMLCWSXW32MKXM',
        confirmedAt: new Date(),
      },
    },
    role: 'ADMIN',
  });
}
