import type { Prisma } from '#generated/prisma/client.js';
import type { RegistrationForm } from '#app/registration/registration.form';
import { RegistrationEventDataHelper } from '#app/registration/registration.helper';

/**
 * The columns a registration's answers imply, mapped from the values tagged
 * with a `eventDataType` in the event's form. The single definition of what the
 * computed columns mean — the API derives them on every write, and the seed
 * derives them from the answers it generates. The group isn't one of them: it
 * is chosen, not answered, so editing the answers never moves it.
 */
export function computedRegistrationData(
  dataByTags: Record<string, unknown[]>,
): Partial<Prisma.RegistrationCreateInput> {
  const helper = new RegistrationEventDataHelper(dataByTags);

  return {
    firstName: helper.firstName() ?? null,
    lastName: helper.lastName() ?? null,
    street: helper.street() ?? null,
    city: helper.city() ?? null,
    zipCode: helper.zipCode() ?? null,
    country: helper.country() ?? null,
    dateOfBirth: helper.dateOfBirth() ?? null,
    emails: helper.emails() ?? [],
    phoneNumbers: helper.phoneNumbers() ?? [],
    role: helper.role() ?? null,
    gender: helper.gender() ?? null,
  };
}

/**
 * Every column a registration's answers imply: the `eventDataType` ones and
 * those its consents imply. What every write and the seeder store, so none can
 * leave one out.
 */
export function registrationColumns(
  form: RegistrationForm,
): Partial<Prisma.RegistrationCreateInput> {
  return {
    ...computedRegistrationData(form.extractEventData()),
    ...form.consentColumns(),
  };
}
