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
        en: 'Street & number',
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
        en: 'Zip code',
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
        en: 'Place',
        fr: 'Ville',
      },
      isRequired: true,
      startWithNewLine: false,
    },
    {
      type: 'country',
      name: 'country',
      title: {
        de: 'Land',
        en: 'Country',
        fr: 'Pays',
      },
      isRequired: true,
    },
  ],
};

export default address;
