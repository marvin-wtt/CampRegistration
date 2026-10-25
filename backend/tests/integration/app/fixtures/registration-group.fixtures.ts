import { createForm } from '../utils/form.js';

// Two groups, each with room to spare.
const international = {
  countries: ['de', 'fr'],
  maxParticipants: { de: 5, fr: 5 },
};

const address = (groupCountryMatch?: string) => ({
  type: 'address',
  name: 'address',
  eventDataType: 'address',
  isRequired: true,
  ...(groupCountryMatch ? { groupCountryMatch } : {}),
});

const firstName = {
  type: 'text',
  name: 'first_name',
  eventDataType: 'first_name',
  isRequired: true,
};

export const eventWithStrictAddress = {
  ...international,
  form: createForm([firstName, address()]),
};

export const eventWithWarnAddress = {
  ...international,
  form: createForm([firstName, address('warn')]),
};

export const eventWithFreeAddress = {
  ...international,
  form: createForm([firstName, address('free')]),
};

export const eventWithStrictCountry = {
  ...international,
  form: createForm([
    firstName,
    { type: 'country', name: 'country', eventDataType: 'country' },
  ]),
};

// A computed column that depends on the group, so reading answers without it
// stores another value.
export const roleByGroupForm = createForm([
  firstName,
  {
    type: 'expression',
    name: 'role',
    eventDataType: 'role',
    expression: "iif({event.group} = 'fr', 'counselor', 'participant')",
  },
]);

export const eventWithRoleByGroup = {
  ...international,
  form: roleByGroupForm,
};

export const eventNationalWithAddress = {
  countries: ['de'],
  maxParticipants: 5,
  form: createForm([firstName, address()]),
};

// Each group with its own contact and templates, so a message shows whose it is.
export const eventWithGroupMessages = {
  countries: ['de', 'fr'],
  maxParticipants: { de: 5, fr: 5 },
  contactEmail: { de: 'de@example.com', fr: 'fr@example.com' },
  form: createForm([
    firstName,
    { type: 'text', name: 'email', eventDataType: 'email' },
  ]),
};

export const groupTemplates = [
  'registration_submitted',
  'registration_confirmed',
  'registration_waitlisted',
].flatMap((trigger) =>
  ['de', 'fr'].map((group) => ({
    trigger,
    group,
    subject: `${trigger} ${group}`,
    body: 'Hello',
  })),
);

export const addressIn = (country?: string) => ({
  address: 'Main Street 1',
  zip_code: '12345',
  city: 'Sometown',
  ...(country ? { country } : {}),
});
