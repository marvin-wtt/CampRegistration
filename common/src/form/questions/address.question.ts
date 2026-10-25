import { type ICustomQuestionTypeConfiguration, Serializer } from 'survey-core';
import {
  applyAddressCountry,
  groupCountryMatchProperty,
} from './groupCountryMatch.js';
import type { Localized } from '../../locales.js';

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
      } satisfies Localized,
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
      } satisfies Localized,
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
      } satisfies Localized,
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
      } satisfies Localized,
      isRequired: true,
    },
  ],
  onInit() {
    Serializer.addProperty('address', groupCountryMatchProperty);
  },
  onLoaded(question) {
    applyAddressCountry(question);
  },
};

export default address;
