import { RegistrationFactory } from '../factories';
import { Camp } from '#generated/prisma/client.js';
import { faker } from '@faker-js/faker/locale/en';
import moment from 'moment';

type Data = Parameters<(typeof RegistrationFactory)['create']>[0];

export class RegistrationSeeder {
  constructor(private camp: Camp) {}

  async seed(n: number = 50, overrides: Data = {}): Promise<void> {
    for (let i = 0; i < n; i++) {
      const country =
        (overrides.country as string | undefined) ??
        faker.helpers.arrayElement(this.camp.countries);
      const gender =
        (overrides.gender as string | undefined) ??
        faker.helpers.arrayElement(['m', 'f']);
      const role = (overrides.role as string | undefined) ?? 'participant';
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const dateOfBirth = faker.date.between({
        from: moment(this.camp.startAt)
          .subtract(this.camp.maxAge, 'years')
          .toDate(),
        to: moment(this.camp.startAt)
          .subtract(this.camp.minAge, 'years')
          .toDate(),
      });
      const email = faker.internet.email({ firstName, lastName });
      const street = faker.location.streetAddress();
      const city = faker.location.city();
      const zipCode = faker.location.zipCode();
      const isMinor = moment(this.camp.startAt).diff(dateOfBirth, 'years') < 18;

      // Mirrors the field names used by the example camp's registration form
      // so the raw `data` blob stays consistent with the computed columns.
      const formData: Record<string, unknown> = {
        role,
        first_name: firstName,
        last_name: lastName,
        gender,
        date_of_birth: moment(dateOfBirth).format('YYYY-MM-DD'),
        address: {
          address: street,
          city,
          zip_code: zipCode,
          country,
        },
        email,
        phone_number: faker.phone.number(),
        medical_restrictions:
          faker.helpers.maybe(() => faker.lorem.sentence(), {
            probability: 0.2,
          }) ?? '',
        food_intolerance:
          faker.helpers.maybe(() => faker.lorem.words(3), {
            probability: 0.2,
          }) ?? '',
        additional_information:
          faker.helpers.maybe(() => faker.lorem.sentence(), {
            probability: 0.1,
          }) ?? '',
        permission_swim: faker.datatype.boolean(),
        permission_written_consent: faker.datatype.boolean(),
        permission_leave: faker.helpers.arrayElement([0, 1, 2]),
        consent_rules: true,
        consent_general_terms_and_conditions: true,
        consent_forward_list_participants: faker.datatype.boolean(),
        consent_privacy: faker.datatype.boolean(),
      };

      if (isMinor) {
        formData.guardian_first_name = faker.person.firstName();
        formData.guardian_last_name = faker.person.lastName();
        formData.guardian_email = faker.internet.email();
        formData.confirmation_guardian = true;
        formData.emergency_contacts = [
          {
            description: faker.helpers.arrayElement(['Mother', 'Father']),
            phone_number: faker.phone.number(),
          },
        ];
      }

      await RegistrationFactory.create({
        camp: { connect: { id: this.camp.id } },
        firstName,
        lastName,
        gender,
        role,
        country,
        dateOfBirth,
        emails: [email],
        street,
        city,
        zipCode,
        data: formData,
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
}
