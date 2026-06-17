import { RegistrationFactory } from '../factories';
import { Camp } from '#generated/prisma/client.js';
import { faker } from '@faker-js/faker/locale/en';
import moment from 'moment';

type Data = Parameters<(typeof RegistrationFactory)['create']>[0];

export class RegistrationSeeder {
  constructor(private camp: Camp) {}

  async seed(n: number = 50, data: Data = {}): Promise<void> {
    for (let i = 0; i < n; i++) {
      await RegistrationFactory.create({
        camp: { connect: { id: this.camp.id } },
        country: faker.helpers.arrayElement(this.camp.countries),
        gender: faker.helpers.arrayElement(['m', 'f']),
        dateOfBirth: faker.date.between({
          from: moment(this.camp.startAt)
            .subtract(this.camp.maxAge, 'years')
            .toDate(),
          to: moment(this.camp.startAt)
            .subtract(this.camp.minAge, 'years')
            .toDate(),
        }),
        createdAt: faker.date.between({
          from: moment
            .min(moment(this.camp.startAt).subtract(60, 'days'), moment())
            .toDate(),
          to: moment
            .min(moment(this.camp.startAt).subtract(30, 'days'), moment())
            .toDate(),
        }),
        ...data,
      });
    }
  }
}
