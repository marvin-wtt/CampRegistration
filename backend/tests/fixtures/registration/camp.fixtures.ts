import { createForm } from '../../utils/form';

export const campPrivate = {
  active: true,
  public: false,
  form: createForm([
    {
      name: 'first_name',
      type: 'text',
      isRequired: true,
    },
  ]),
};

export const campPublic = {
  active: true,
  public: false,
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
  active: true,
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
  active: true,
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
  active: true,
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

export const campWithCustomFields = {
  active: true,
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
  active: true,
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
  active: true,
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
  active: true,
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
  active: true,
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
  active: true,
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
      campDataType: 'address',
      isRequired: true,
    },
  ]),
};

export const campWithMaxParticipantsRolesNational = {
  active: true,
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
  active: true,
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

export const campWithSingleCampDataType = {
  active: true,
  form: createForm([
    {
      name: 'email',
      type: 'text',
      campDataType: 'email-primary',
    },
    {
      name: 'other',
      type: 'text',
      isRequired: true,
    },
  ]),
};

export const campWithMultipleCampDataValues = {
  active: true,
  form: createForm([
    {
      name: 'email',
      type: 'text',
      campDataType: 'email-primary',
    },
    {
      name: 'otherEmail',
      type: 'text',
      campDataType: 'email-primary',
    },
    {
      name: 'other',
      type: 'text',
      isRequired: true,
    },
  ]),
};

export const campWithMultipleCampDataTypes = {
  active: true,
  form: createForm([
    {
      name: 'email',
      type: 'text',
      campDataType: 'email-primary',
    },
    {
      name: 'country',
      type: 'text',
      campDataType: 'country',
    },
    {
      name: 'other',
      type: 'text',
      isRequired: true,
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
  form: createForm([
    {
      name: 'email',
      type: 'text',
      campDataType: 'email',
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
