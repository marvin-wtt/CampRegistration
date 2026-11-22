import type { Prisma } from '#generated/prisma/client.js';
import type { EventDataTag } from '@camp-registration/common/form';
import type { RegistrationForm } from '#app/registration/registration.form';

/** The answers of a form's tagged questions, by `eventDataType`. */
type TaggedAnswers = Partial<Record<EventDataTag, unknown[]>>;

const isText = (value: unknown): value is string => typeof value === 'string';

/** The first text answer of a tag. */
function first(answers: TaggedAnswers, tag: EventDataTag): string | null {
  return answers[tag]?.find(isText) ?? null;
}

/** Every non-empty text answer of a tag. */
function all(answers: TaggedAnswers, tag: EventDataTag): string[] {
  return (answers[tag] ?? []).filter(
    (value): value is string => isText(value) && !!value,
  );
}

// Each single address tag, by the key of its field in an `address` answer.
const ADDRESS_FIELDS = {
  street: 'address',
  zip_code: 'zip_code',
  city: 'city',
  country: 'country',
} as const satisfies Partial<Record<EventDataTag, string>>;

/**
 * A single address field: its own question first, else the field of the first
 * `address` question.
 */
function addressField(
  answers: TaggedAnswers,
  tag: keyof typeof ADDRESS_FIELDS,
): string | null {
  const own = first(answers, tag);
  if (own !== null) {
    return own;
  }

  const address = answers.address?.[0];
  if (!address || typeof address !== 'object') {
    return null;
  }
  const value = (address as Record<string, unknown>)[ADDRESS_FIELDS[tag]];

  return isText(value) ? value : null;
}

/** An ISO timestamp, or null for an answer that is no date. */
function date(answers: TaggedAnswers, tag: EventDataTag): string | null {
  const value = first(answers, tag);
  const parsed = value !== null ? new Date(value) : null;

  return parsed && !Number.isNaN(parsed.getTime())
    ? parsed.toISOString()
    : null;
}

/**
 * The columns a registration's answers imply, mapped from the values tagged
 * with an `eventDataType` in the event's form. The single definition of what
 * the computed columns mean — the API derives them on every write, and the
 * seed derives them from the answers it generates. The group isn't one of
 * them: it is chosen, not answered, so editing the answers never moves it.
 */
export function computedRegistrationData(
  answers: TaggedAnswers,
): Partial<Prisma.RegistrationCreateInput> {
  return {
    firstName: first(answers, 'first_name'),
    lastName: first(answers, 'last_name'),
    street: addressField(answers, 'street'),
    city: addressField(answers, 'city'),
    zipCode: addressField(answers, 'zip_code'),
    country: addressField(answers, 'country'),
    dateOfBirth: date(answers, 'date_of_birth'),
    emails: all(answers, 'email'),
    phoneNumbers: all(answers, 'phone'),
    role: first(answers, 'role'),
    gender: first(answers, 'gender'),
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
