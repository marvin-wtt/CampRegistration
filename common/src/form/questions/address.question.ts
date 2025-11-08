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
        pl: 'Ulica i numer domu',
        cs: 'Ulice a číslo domu',
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
        pl: 'Kod pocztowy',
        cs: 'Poštovní směrovací číslo',
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
        pl: 'Miejsce',
        cs: 'Místo',
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
        pl: 'Kraj',
        cs: 'Země',
      },
      isRequired: true,
    },
  ],
};

export default address;
