import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

type UpdateBodyData = {
  name: string;
  user?: Partial<Prisma.UserCreateInput>;
  data: object;
  expected: number;
};

export const profileUpdateBody: UpdateBodyData[] = [
  // name
  {
    name: 'name',
    user: {},
    data: {
      name: 'Tester',
    },
    expected: 200,
  },
  {
    name: 'name null',
    user: {},
    data: {
      name: null,
    },
    expected: 400,
  },
  // email
  {
    name: 'email',
    user: {},
    data: {
      email: 'email@example.com',
    },
    expected: 200,
  },
  {
    name: 'email invalid',
    user: {},
    data: {
      email: 'invalid-email.com',
    },
    expected: 400,
  },
  {
    name: 'email null',
    user: {},
    data: {
      email: null,
    },
    expected: 400,
  },
  // password
  {
    name: 'password',
    user: {
      password: bcrypt.hashSync('password', 8),
    },
    data: {
      password: 'ads322#sdA',
      currentPassword: 'password',
    },
    expected: 200,
  },
  {
    name: 'password null',
    user: {},
    data: {
      password: null,
    },
    expected: 400,
  },
  {
    name: 'current password missing',
    user: {},
    data: {
      password: 'ads322#sdA',
    },
    expected: 400,
  },
  {
    name: 'current password invalid',
    user: {},
    data: {
      password: 'ads322#sdA',
      currentPassword: 'ads322#sdA',
    },
    expected: 400,
  },
  // role
  {
    name: 'role',
    user: {},
    data: {
      role: 'ADMIN',
    },
    expected: 400,
  },
  // locale
  {
    name: 'locale short',
    user: {},
    data: {
      locale: 'en',
    },
    expected: 200,
  },
  {
    name: 'locale long',
    user: {},
    data: {
      locale: 'en-US',
    },
    expected: 200,
  },
  {
    name: 'locale invalid',
    user: {},
    data: {
      locale: 'english',
    },
    expected: 400,
  },
  {
    name: 'locale null',
    user: {},
    data: {
      locale: null,
    },
    expected: 400,
  },
];
