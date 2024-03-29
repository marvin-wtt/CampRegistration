import { PrismaClient, PrismaPromise } from '@prisma/client';

const name = 'user';
const run = (prisma: PrismaClient): PrismaPromise<unknown> => {
  return prisma.user.create({
    data: {
      id: '01H4BK7J4WV75DZNAQBHMM99MA',
      name: 'John Doe',
      email: 'john@example.com',
      password: '$2a$12$f4dwwAVJRqlz4okStqitmuC5UKrDhWMFjZEtviqrEJp4.in2uFPAK', // "password"
      emailVerified: true,
    },
  });
};

export default {
  name,
  run,
};
