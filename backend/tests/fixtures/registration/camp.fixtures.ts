import { createForm } from "../../utils/form";

export const campPrivate = {
  active: true,
  public: false,
  form: createForm([
    {
      name: "first_name",
      type: "text",
      isRequired: true,
    },
  ]),
};

export const campWithFileRequired = {
  active: true,
  form: createForm([
    {
      name: "some_field",
      type: "text",
      isRequired: true,
    },
    {
      name: "some_file",
      type: "file",
      isRequired: true,
    },
  ]),
};

export const campWithCustomFields = {
  active: true,
  form: createForm([
    {
      name: "first_name",
      type: "text",
      isRequired: true,
    },
    {
      name: "role",
      type: "role",
      isRequired: true,
    },
  ]),
};

export const campWithFileOptional = {
  active: true,
  form: createForm([
    {
      name: "some_field",
      type: "text",
      isRequired: true,
    },
    {
      name: "some_file",
      type: "file",
      isRequired: false,
    },
  ]),
};

export const campWithMaxParticipantsNational = {
  active: true,
  maxParticipants: 5,
  form: createForm([
    {
      name: "first_name",
      type: "text",
      isRequired: true,
    },
  ]),
  accessors: {},
};

export const campWithMaxParticipantsInternational = {
  active: true,
  countries: ["de", "fr"],
  maxParticipants: {
    de: 5,
    fr: 3,
  },
  form: createForm([
    {
      name: "first_name",
      type: "text",
      isRequired: true,
    },
    {
      name: "country",
      type: "text",
      campDataType: "country",
      isRequired: true,
    },
  ]),
  accessors: {
    country: [["country"]],
  },
};

export const campWithMaxParticipantsRolesNational = {
  active: true,
  maxParticipants: 5,
  form: createForm([
    {
      name: "first_name",
      type: "text",
      isRequired: true,
    },
    {
      name: "role",
      type: "text",
      campDataType: "role",
      isRequired: true,
    },
  ]),
  accessors: {
    role: [["role"]],
  },
};

export const campWithMaxParticipantsRolesInternational = {
  active: true,
  countries: ["de", "fr"],
  maxParticipants: {
    de: 5,
    fr: 3,
  },
  form: createForm([
    {
      name: "first_name",
      type: "text",
      isRequired: true,
    },
    {
      name: "role",
      type: "text",
      campDataType: "role",
      isRequired: true,
    },
    {
      name: "country",
      type: "text",
      campDataType: "country",
      isRequired: true,
    },
  ]),
  accessors: {
    role: [["role"]],
    country: [["country"]],
  },
};
