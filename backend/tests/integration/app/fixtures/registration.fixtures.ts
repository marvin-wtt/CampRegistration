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
      minValueExpression: '{camp.minAge}',
      maxValueExpression: '{camp.maxAge}',
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
      campDataType: 'country',
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
      campDataType: 'address',
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
      campDataType: 'role',
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
      campDataType: 'role',
      isRequired: true,
    },
    {
      name: 'country',
      type: 'text',
      campDataType: 'country',
      isRequired: true,
    },
  ]),
};

export const eventWithAddressEventDataTypes = {
  form: createForm([
    {
      name: 'address',
      type: 'text',
      campDataType: 'address',
    },
  ]),
};

export const eventWithAllEventDataTypes = {
  form: createForm([
    {
      name: 'firstName',
      type: 'text',
      campDataType: 'first_name',
    },
    {
      name: 'lastName',
      type: 'text',
      campDataType: 'last_name',
    },
    {
      name: 'dateOfBirth',
      type: 'text',
      inputType: 'date',
      campDataType: 'date_of_birth',
    },
    {
      name: 'email',
      type: 'text',
      inputType: 'email',
      campDataType: 'email',
    },
    {
      name: 'emailSecondary',
      type: 'text',
      inputType: 'email',
      campDataType: 'email',
    },
    {
      name: 'role',
      type: 'text',
      campDataType: 'role',
    },
    {
      name: 'gender',
      type: 'text',
      campDataType: 'gender',
    },
    {
      name: 'street',
      type: 'text',
      campDataType: 'street',
    },
    {
      name: 'city',
      type: 'text',
      campDataType: 'city',
    },
    {
      name: 'zipCode',
      type: 'text',
      campDataType: 'zip_code',
    },
    {
      name: 'country',
      type: 'text',
      campDataType: 'country',
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
      campDataType: 'country',
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
      campDataType: 'email',
    },
    {
      name: 'first_name',
      type: 'text',
      campDataType: 'first_name',
    },
    {
      name: 'last_name',
      type: 'text',
      campDataType: 'last_name',
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
      campDataType: 'email',
    },
    {
      name: 'first_name',
      type: 'text',
      campDataType: 'first_name',
    },
    {
      name: 'last_name',
      type: 'text',
      campDataType: 'last_name',
    },
    {
      name: 'country',
      type: 'text',
      campDataType: 'country',
    },
  ]),
};

export const eventWithMultipleEmails = {
  ...eventListed,
  form: createForm([
    {
      name: 'email',
      type: 'text',
      campDataType: 'email',
    },
    {
      name: 'emailGuardian',
      type: 'text',
      campDataType: 'email',
    },
    {
      name: 'full_name',
      type: 'text',
      campDataType: 'full_name',
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
      campDataType: 'country',
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
      campDataType: 'email',
    },
    {
      name: 'first_name',
      type: 'text',
      campDataType: 'first_name',
    },
    {
      name: 'last_name',
      type: 'text',
      campDataType: 'last_name',
    },
    {
      name: 'country',
      type: 'text',
      campDataType: 'country',
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
