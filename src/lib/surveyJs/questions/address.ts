import { ICustomQuestionTypeConfiguration } from 'survey-core';

const address: ICustomQuestionTypeConfiguration = {
  name: 'address',
  title: 'Address',
  elementsJSON: [
    {
      type: 'text',
      name: 'address',
      autocomplete: 'street-address',
      title: {
        de: 'Straße & Hausnummer',
        fr: 'Rue & Numéro',
      },
      isRequired: true,
    },
    {
      name: 'zip_code',
      type: 'text',
      autocomplete: 'postal-code',
      title: {
        de: 'Postleitzahl',
        fr: 'Code Postal',
      },
      isRequired: true,
    },
    {
      name: 'city',
      type: 'text',
      autocomplete: 'address-level2',
      title: {
        de: 'Ort',
        fr: 'Lieu',
      },
      isRequired: true,
      startWithNewLine: false,
    },
    {
      type: 'country',
      name: 'country',
      title: {
        de: 'Land',
        fr: 'Pays',
      },
      isRequired: true,
    },
  ],
};

export default address;
