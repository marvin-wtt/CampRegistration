import { createForm } from '../utils/form.js';
import { Prisma } from '#generated/prisma/client';

export const eventPrivate = {
  listed: false,
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      isRequired: true,
    },
  ]),
};

export const eventListed: Partial<Prisma.EventCreateInput> = {
  listed: false,
  confirmationMode: 'AUTOMATIC',
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      isRequired: true,
    },
    {
      name: 'last_name',
      type: 'text',
    },
  ]),
};

export const eventWithAdditionalFields = {
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      isRequired: true,
    },
    {
      name: 'invisible_field',
      type: 'text',
      isRequired: true,
      visible: false,
    },
  ]),
};

export const eventWithRequiredField = {
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      isRequired: true,
    },
    {
      name: 'last_name',
      type: 'text',
      isRequired: true,
    },
  ]),
};

export const eventWithFileRequired = {
  form: createForm([
    {
      name: 'some_field',
      type: 'text',
      isRequired: true,
    },
    {
      name: 'some_file',
      type: 'file',
      isRequired: true,
    },
  ]),
};

export const eventWithMultipleFilesRequired = {
  form: createForm([
    {
      name: 'some_field',
      type: 'text',
      isRequired: true,
    },
    {
      name: 'some_files',
      type: 'file',
      isRequired: true,
      allowMultiple: true,
    },
  ]),
};

export const eventWithCustomFields = {
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      isRequired: true,
    },
    {
      name: 'role',
      type: 'role',
      isRequired: true,
    },
  ]),
};

export const eventWithEventVariable = {
  minAge: 10,
  maxAge: 15,
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      isRequired: true,
    },
    {
      name: 'age',
      type: 'text',
      inputType: 'number',
      minValueExpression: '{event.minAge}',
      maxValueExpression: '{event.maxAge}',
      isRequired: true,
    },
  ]),
};

export const eventWithFileOptional = {
  form: createForm([
    {
      name: 'some_field',
      type: 'text',
      isRequired: true,
    },
    {
      name: 'some_file',
      type: 'file',
      isRequired: false,
    },
  ]),
};

export const eventWithMaxParticipantsNational = {
  maxParticipants: 5,
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      isRequired: true,
    },
  ]),
};

export const eventWithMaxParticipantsInternational = {
  countries: ['de', 'fr'],
  maxParticipants: {
    de: 5,
    fr: 3,
  },
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      isRequired: true,
    },
    {
      name: 'country',
      type: 'text',
      eventDataType: 'country',
      isRequired: true,
    },
  ]),
};

export const eventWithAddress = {
  countries: ['de', 'fr'],
  maxParticipants: {
    de: 5,
    fr: 3,
  },
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      isRequired: true,
    },
    {
      name: 'address',
      type: 'text',
      eventDataType: 'address',
      isRequired: true,
    },
  ]),
};

export const eventWithMaxParticipantsRolesNational = {
  maxParticipants: 5,
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      isRequired: true,
    },
    {
      name: 'role',
      type: 'text',
      eventDataType: 'role',
      isRequired: true,
    },
  ]),
};

export const eventWithMaxParticipantsRolesInternational = {
  countries: ['de', 'fr'],
  maxParticipants: {
    de: 5,
    fr: 3,
  },
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      isRequired: true,
    },
    {
      name: 'role',
      type: 'text',
      eventDataType: 'role',
      isRequired: true,
    },
    {
      name: 'country',
      type: 'text',
      eventDataType: 'country',
      isRequired: true,
    },
  ]),
};

export const eventWithAddressEventDataTypes = {
  form: createForm([
    {
      name: 'address',
      type: 'text',
      eventDataType: 'address',
    },
  ]),
};

export const eventWithAllEventDataTypes = {
  form: createForm([
    {
      name: 'firstName',
      type: 'text',
      eventDataType: 'first_name',
    },
    {
      name: 'lastName',
      type: 'text',
      eventDataType: 'last_name',
    },
    {
      name: 'dateOfBirth',
      type: 'text',
      inputType: 'date',
      eventDataType: 'date_of_birth',
    },
    {
      name: 'email',
      type: 'text',
      inputType: 'email',
      eventDataType: 'email',
    },
    {
      name: 'emailSecondary',
      type: 'text',
      inputType: 'email',
      eventDataType: 'email',
    },
    {
      name: 'role',
      type: 'text',
      eventDataType: 'role',
    },
    {
      name: 'gender',
      type: 'text',
      eventDataType: 'gender',
    },
    {
      name: 'street',
      type: 'text',
      eventDataType: 'street',
    },
    {
      name: 'city',
      type: 'text',
      eventDataType: 'city',
    },
    {
      name: 'zipCode',
      type: 'text',
      eventDataType: 'zip_code',
    },
    {
      name: 'country',
      type: 'text',
      eventDataType: 'country',
    },
  ]),
};

export const eventWithoutCountryData = {
  ...eventWithMaxParticipantsInternational,
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      isRequired: true,
    },
    {
      name: 'country',
      type: 'text',
      eventDataType: 'country',
      isRequired: false,
    },
  ]),
};

export const eventWithEmail = {
  ...eventPrivate,
  countries: ['de', 'fr'],
  form: createForm([
    {
      name: 'email',
      type: 'text',
      eventDataType: 'email',
    },
    {
      name: 'first_name',
      type: 'text',
      eventDataType: 'first_name',
    },
    {
      name: 'last_name',
      type: 'text',
      eventDataType: 'last_name',
    },
  ]),
};

export const eventWithEmailAndCountry = {
  ...eventPrivate,
  countries: ['de', 'fr'],
  form: createForm([
    {
      name: 'email',
      type: 'text',
      eventDataType: 'email',
    },
    {
      name: 'first_name',
      type: 'text',
      eventDataType: 'first_name',
    },
    {
      name: 'last_name',
      type: 'text',
      eventDataType: 'last_name',
    },
    {
      name: 'country',
      type: 'text',
      eventDataType: 'country',
    },
  ]),
};

export const eventWithMultipleEmails = {
  ...eventListed,
  form: createForm([
    {
      name: 'email',
      type: 'text',
      eventDataType: 'email',
    },
    {
      name: 'emailGuardian',
      type: 'text',
      eventDataType: 'email',
    },
    {
      name: 'full_name',
      type: 'text',
      eventDataType: 'full_name',
    },
  ]),
};

export const eventWithContactEmailInternational = {
  ...eventListed,
  countries: ['de', 'fr'],
  contactEmail: {
    de: 'de@email.net',
    fr: 'fr@email.net',
  },
  form: createForm([
    {
      name: 'country',
      type: 'text',
      eventDataType: 'country',
    },
  ]),
};

export const eventWithEmailAndMaxParticipants = {
  ...eventListed,
  maxParticipants: 0,
  countries: ['de', 'fr'],
  form: createForm([
    {
      name: 'email',
      type: 'text',
      eventDataType: 'email',
    },
    {
      name: 'first_name',
      type: 'text',
      eventDataType: 'first_name',
    },
    {
      name: 'last_name',
      type: 'text',
      eventDataType: 'last_name',
    },
    {
      name: 'country',
      type: 'text',
      eventDataType: 'country',
    },
  ]),
};

export const eventWithFormFunctions = {
  ...eventListed,
  form: createForm([
    {
      name: 'date',
      type: 'text',
      required: true,
    },
    {
      name: 'test',
      type: 'boolean',
      requiredIf: "isMinor({date}, '2018-01-01')",
    },
  ]),
};
