import { createForm } from '../utils/form.js';
import { Prisma } from '#generated/prisma/client';

export const campPrivate = {
  public: false,
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      isRequired: true,
    },
  ]),
};

export const campPublic: Partial<Prisma.CampCreateInput> = {
  public: false,
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

export const campWithAdditionalFields = {
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

export const campWithRequiredField = {
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

export const campWithFileRequired = {
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

export const campWithMultipleFilesRequired = {
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

export const campWithCustomFields = {
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

export const campWithCampVariable = {
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

export const campWithFileOptional = {
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

export const campWithMaxParticipantsNational = {
  maxParticipants: 5,
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      isRequired: true,
    },
  ]),
};

export const campWithMaxParticipantsInternational = {
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

export const campWithAddress = {
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

export const campWithMaxParticipantsRolesNational = {
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

export const campWithMaxParticipantsRolesInternational = {
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

export const campWithAddressCampDataTypes = {
  form: createForm([
    {
      name: 'address',
      type: 'text',
      campDataType: 'address',
    },
  ]),
};

export const campWithAllCampDataTypes = {
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

export const campWithoutCountryData = {
  ...campWithMaxParticipantsInternational,
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

export const campWithEmail = {
  ...campPrivate,
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

export const campWithEmailAndCountry = {
  ...campPrivate,
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

export const campWithMultipleEmails = {
  ...campPublic,
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

export const campWithContactEmailInternational = {
  ...campPublic,
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

export const campWithEmailAndMaxParticipants = {
  ...campPublic,
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

export const campWithFormFunctions = {
  ...campPublic,
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
