import moment from "moment/moment";
import { createForm } from "../../utils/form";

export const campCreateNational = {
  active: false,
  public: false,
  countries: ["de"],
  name: "Test Camp",
  organization: "Test Org",
  contactEmail: "test@example.com",
  maxParticipants: 10,
  minAge: 10,
  maxAge: 15,
  startAt: moment().add("20 days").startOf("hour").toDate().toISOString(),
  endAt: moment().add("22 days").startOf("hour").toDate().toISOString(),
  price: 100.0,
  location: "Somewhere",
  form: {},
  themes: {},
};

export const campCreateInternational = {
  ...campCreateNational,
  countries: ["de", "fr"],
  name: {
    de: "Beispiel Camp",
    fr: "Exemple de camp",
  },
  organization: {
    de: "Beispiel Organisation",
    fr: "Exemple d'organisation",
  },
  contactEmail: {
    de: "test@example.de",
    fr: "test@example.fr",
  },
  location: {
    de: "Irgendwo",
    fr: "Quelque part",
  },
  maxParticipants: {
    de: 10,
    fr: 11,
  },
};

export const campCreateMissingPartialMaxParticipants = {
  ...campCreateInternational,
  maxParticipants: {
    de: 10,
  },
};

export const campCreateMissingPartialName = {
  ...campCreateInternational,
  name: {
    fr: "Exemple de camp",
  },
};

export const campCreateMissingUntranslatedMaxParticipants = {
  ...campCreateInternational,
  maxParticipants: 20,
};

export const campCreateMissingUntranslatedNames = {
  ...campCreateInternational,
  name: "Example Camp",
};

export const campCreateAccessorsSingleType = {
  ...campCreateNational,
  form: createForm([
    {
      name: "email",
      type: "text",
      campDataType: "email-primary",
    },
  ]),
};

export const campCreateAccessorsSingleTypeAndValueName = {
  ...campCreateNational,
  form: createForm([
    {
      name: "email",
      valueName: "my-email",
      type: "text",
      campDataType: "email-primary",
    },
  ]),
};

export const campCreateAccessorsSingleTypeMultipleFields = {
  ...campCreateNational,
  form: createForm([
    {
      name: "email",
      type: "text",
      campDataType: "email-primary",
    },
    {
      name: "other-email",
      type: "text",
      campDataType: "email-primary",
    },
  ]),
};

export const campCreateAccessorsNestedName = {
  ...campCreateNational,
  form: createForm([
    {
      type: "panel",
      name: "personal-information",
      elements: [
        {
          name: "email",
          type: "text",
          campDataType: "email-primary",
        },
      ],
    },
  ]),
};

export const campCreateAccessorsMultipleTypes = {
  ...campCreateNational,
  form: createForm([
    {
      name: "email",
      campDataType: "email-primary",
    },
    {
      name: "other-email",
      campDataType: "email-secondary",
    },
  ]),
};
