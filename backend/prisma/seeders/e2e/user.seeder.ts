import { UserFactory } from '../../factories';

// One user per role below DIRECTOR on the simple event, and an organization
// admin who holds only the implicit organization grants.
export const E2E_ROLE_USERS = {
  COORDINATOR: '01H4BK7J4WV75DZNAQBHMM99C0',
  COUNSELOR: '01H4BK7J4WV75DZNAQBHMM99C1',
  VIEWER: '01H4BK7J4WV75DZNAQBHMM99V0',
  ORGANIZATION_ADMIN: '01H4BK7J4WV75DZNAQBHMM99A0',
} as const;

export async function seedE2eUsers(): Promise<void> {
  for (const [role, id] of Object.entries(E2E_ROLE_USERS)) {
    const name = role.toLowerCase().replace('_', '-');
    await UserFactory.create({
      id,
      name,
      email: `${name}@example.com`,
      password: 'password',
      emailVerified: true,
    });
  }

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
