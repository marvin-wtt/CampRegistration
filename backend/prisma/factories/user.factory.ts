import { fakerDE as faker } from '@faker-js/faker';
import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';
import bcrypt from 'bcryptjs';

/** The TOTP secret of administrators the factory creates. */
const ADMIN_TOTP_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

export const UserFactory = {
  build: (
    data: Partial<Prisma.UserCreateInput> = {},
  ): Prisma.UserCreateInput => {
    // Administrators need 2FA for their role to apply. Pass `twoFactor`
    // (even as `undefined`) to override.
    const twoFactor =
      data.role === 'ADMIN' && !('twoFactor' in data)
        ? {
            create: {
              secret: ADMIN_TOTP_SECRET,
              confirmedAt: new Date(),
            },
          }
        : data.twoFactor;

    return {
      name: faker.person.fullName(),
      email: faker.internet.exampleEmail().toLowerCase(),
      emailVerified: true,
      ...data,
      twoFactor,
      password: bcrypt.hashSync(data.password ?? 'password', 8),
    };
  },

  create: async (data: Partial<Prisma.UserCreateInput> = {}) => {
    return prisma.user.create({
      data: UserFactory.build(data),
    });
  },
};
