import { PrismaClient } from '@prisma/client';
import form from './json/campForm.json';
import { ulid } from '../../src/utils/ulid';

const name = 'camp';

const run = (prisma: PrismaClient) => {
  return prisma.camp.create({
    data: {
      id: '01H4BK6DFQAVVB5TDS5BJ1AB95 ',
      public: true,
      active: true,
      countries: ['de', 'fr'],
      organizer: {
        de: 'Luftsportjugend des DAeC',
        fr: "Fédération Française d'Aérostation",
      },
      contactEmail: 'jugendleiter@ballaeron.de',
      name: {
        de: 'DFJW Ballonsommercamp 2023',
        fr: "OFAJ Camp d'été en montgolfière 2023",
      },
      maxParticipants: {
        de: '16',
        fr: '16',
      },
      minAge: 13,
      maxAge: 19,
      startAt: new Date('2023-07-29T00:00:00'),
      endAt: new Date('2023-08-05T00:00:00'),
      location: {
        de: 'Bartholomä',
        fr: 'Bartholomä',
      },
      price: 250.0,
      form: form,
      themes: {},
      campManager: {
        create: {
          id: ulid(),
          userId: '01H4BK7J4WV75DZNAQBHMM99MA',
        },
      },
    },
  });
};

export default {
  name,
  run,
};
