import { Prisma } from '#generated/prisma/client';

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
    user: {
      password: 'password',
    },
    data: {
      email: 'email@example.com',
      currentPassword: 'password',
    },
    expected: 200,
  },
  {
    name: 'email invalid',
    user: {
      password: 'password',
    },
    data: {
      email: 'invalid-email.com',
      currentPassword: 'password',
    },
    expected: 400,
  },
  {
    name: 'email null',
    user: {
      password: 'password',
    },
    data: {
      email: null,
      currentPassword: 'password',
    },
    expected: 400,
  },
  {
    name: 'email: current password missing',
    user: {},
    data: {
      email: 'email@example.com',
    },
    expected: 400,
  },
  {
    name: 'email: current password invalid',
    user: {
      password: 'password',
    },
    data: {
      email: 'email@example.com',
      currentPassword: 'ads322#sdA',
    },
    expected: 400,
  },
  // password
  {
    name: 'password',
    user: {
      password: 'password',
    },
    data: {
      password: 'ads322#sdA',
      currentPassword: 'password',
    },
    expected: 200,
  },
  {
    name: 'password null',
    user: {
      password: 'password',
    },
    data: {
      password: null,
      currentPassword: 'password',
    },
    expected: 400,
  },
  {
    name: 'password: current password missing',
    user: {},
    data: {
      password: 'ads322#sdA',
    },
    expected: 400,
  },
  {
    name: 'password: current password invalid',
    user: {
      password: 'password',
    },
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
