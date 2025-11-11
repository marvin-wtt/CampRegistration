import { ulid } from 'ulidx';

type UpdateBodyData = {
  name: string;
  data: object;
  expected: number;
};

export const messageCreateBody: UpdateBodyData[] = [
  {
    name: 'Registrations missing',
    data: {
      subject: 'Subject',
      body: 'Body',
    },
    expected: 400,
  },
  {
    name: 'Registrations empty',
    data: {
      registrationIds: [],
      subject: 'Subject',
      body: 'Body',
    },
    expected: 400,
  },
  // Subject
  {
    name: 'Subject missing',
    data: {
      registrationIds: [ulid()],
      body: 'Body',
    },
    expected: 400,
  },
  {
    name: 'Subject null',
    data: {
      registrationIds: [ulid()],
      body: 'Body',
      subject: null,
    },
    expected: 400,
  },
  {
    name: 'Subject empty',
    data: {
      registrationIds: [ulid()],
      body: 'Body',
      subject: '',
    },
    expected: 400,
  },
  // Body
  {
    name: 'Body missing',
    data: {
      registrationIds: [ulid()],
      subject: 'Subject',
    },
    expected: 400,
  },
  {
    name: 'Body null',
    data: {
      registrationIds: [ulid()],
      body: null,
      subject: 'Subject',
    },
    expected: 400,
  },
  {
    name: 'Body empty',
    data: {
      registrationIds: [ulid()],
      body: '',
      subject: 'Subject',
    },
    expected: 400,
  },
  // Priority
  {
    name: 'Priority low',
    data: {
      registrationIds: [ulid()],
      subject: 'Subject',
      body: 'Body',
      priority: 'low',
    },
    expected: 201,
  },
  {
    name: 'Priority normal',
    data: {
      registrationIds: [ulid()],
      subject: 'Subject',
      body: 'Body',
      priority: 'normal',
    },
    expected: 201,
  },
  {
    name: 'Priority high',
    data: {
      registrationIds: [ulid()],
      subject: 'Subject',
      body: 'Body',
      priority: 'high',
    },
    expected: 201,
  },
  {
    name: 'Priority invalid',
    data: {
      registrationIds: [ulid()],
      subject: 'Subject',
      body: 'Body',
      priority: 'medium',
    },
    expected: 400,
  },
  // Reply-To
  {
    name: 'ReplyTo',
    data: {
      registrationIds: [ulid()],
      subject: 'Subject',
      body: 'Body',
      replyTo: 'test@email.com',
    },
    expected: 201,
  },
  {
    name: 'ReplyTo invalid email',
    data: {
      registrationIds: [ulid()],
      subject: 'Subject',
      body: 'Body',
      replyTo: 'test.email.com',
    },
    expected: 400,
  },
  {
    name: 'ReplyTo null',
    data: {
      registrationIds: [ulid()],
      subject: 'Subject',
      body: 'Body',
      replyTo: null,
    },
    expected: 400,
  },
];
