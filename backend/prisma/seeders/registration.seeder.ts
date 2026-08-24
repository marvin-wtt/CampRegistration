import { RegistrationFactory } from '../factories';
import type { Camp, Prisma } from '#generated/prisma/client.js';
import { faker } from '@faker-js/faker/locale/en';
import moment from 'moment';
import { formUtils } from '#utils/form';
import { computedRegistrationData } from '#app/registration/registration.helper.js';
import { localeForCountry } from '#app/camp/presets/locales.js';
import {
  buildRegistrationData,
  freePlacesFor,
  type Registrant,
} from './registration-answers';
import { seedRegistrationUpload } from './file.seeder';

type Data = NonNullable<Parameters<(typeof RegistrationFactory)['create']>[0]>;

export class RegistrationSeeder {
  private uploads = 0;

  constructor(private camp: Camp) {}

  async seed(n: number = 50, overrides: Data = {}): Promise<void> {
    for (let i = 0; i < n; i++) {
      const registrant = this.createRegistrant(overrides);

      // The answers are the source of truth: they are generated from the
      // camp's own form, and the computed columns are then derived from them
      // exactly as the API derives them on submission.
      const waitingList = overrides.status === 'WAITLISTED';
      const { data, fileFields } = buildRegistrationData(
        this.camp,
        registrant,
        {
          waitingList,
        },
      );

      const files = await this.seedUploads(fileFields, data);

      await RegistrationFactory.create({
        camp: { connect: { id: this.camp.id } },
        ...this.computedData(data, waitingList),
        locale: localeForCountry(registrant.country),
        data,
        files: files.length
          ? { connect: files.map((id) => ({ id })) }
          : undefined,
        createdAt: faker.date.between({
          from: moment
            .min(moment(this.camp.startAt).subtract(60, 'days'), moment())
            .toDate(),
          to: moment
            .min(moment(this.camp.startAt).subtract(30, 'days'), moment())
            .toDate(),
        }),
        ...overrides,
      });
    }
  }

  private createRegistrant(overrides: Data): Registrant {
    const country =
      (overrides.country as string | undefined) ??
      faker.helpers.arrayElement(this.camp.countries);
    const role = (overrides.role as string | undefined) ?? 'participant';
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    // Counselors are grown-ups; the camp's age range applies to participants.
    const [youngest, oldest] =
      role === 'participant' ? [this.camp.minAge, this.camp.maxAge] : [19, 45];

    return {
      role,
      firstName,
      lastName,
      gender:
        (overrides.gender as string | undefined) ??
        faker.helpers.arrayElement(['m', 'f']),
      dateOfBirth: faker.date.between({
        from: moment(this.camp.startAt).subtract(oldest, 'years').toDate(),
        to: moment(this.camp.startAt).subtract(youngest, 'years').toDate(),
      }),
      email: faker.internet.email({ firstName, lastName }),
      phoneNumber: faker.phone.number(),
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      zipCode: faker.location.zipCode(),
      country,
      guardians: faker.helpers.multiple(
        () => ({
          firstName: faker.person.firstName(),
          lastName,
          email: faker.internet.email({ lastName }),
        }),
        { count: { min: 1, max: 2 } },
      ),
      emergencyContacts: faker.helpers.multiple(
        () => ({
          description: faker.helpers.arrayElement([
            'Mother',
            'Father',
            'Grandmother',
            'Landline',
          ]),
          phoneNumber: faker.phone.number(),
        }),
        { count: { min: 1, max: 2 } },
      ),
      medicalRestrictions:
        faker.helpers.maybe(() => faker.lorem.sentence(), {
          probability: 0.2,
        }) ?? '',
      foodIntolerance:
        faker.helpers.maybe(() => faker.lorem.words(3), {
          probability: 0.2,
        }) ?? '',
      additionalInformation:
        faker.helpers.maybe(() => faker.lorem.sentence(), {
          probability: 0.1,
        }) ?? '',
    };
  }

  /**
   * One document per file question, written to storage like a real upload and
   * left unattached — the registration claims it when it is created.
   */
  private async seedUploads(
    fileFields: { valueName: string; multiple: boolean }[],
    data: Record<string, unknown>,
  ): Promise<string[]> {
    const ids: string[] = [];

    for (const field of fileFields) {
      const file = await seedRegistrationUpload(
        this.camp,
        this.uploads++,
        field.valueName,
      );

      data[field.valueName] = field.multiple ? [file.id] : file.id;
      ids.push(file.id);
    }

    return ids;
  }

  private computedData(
    data: Record<string, unknown>,
    waitingList: boolean,
  ): Partial<Prisma.RegistrationCreateInput> {
    const form = formUtils(
      { ...this.camp, freePlaces: freePlacesFor(this.camp, waitingList) },
      data,
    );

    return computedRegistrationData(form.extractCampData());
  }
}
