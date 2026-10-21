import { ICustomQuestionTypeConfiguration } from 'survey-core';
import { type AppLocale, EVENT_COUNTRIES } from '../../locales.js';

type EventCountry = (typeof EVENT_COUNTRIES)[number];

// Every country an event can run in needs a name here, or this fails to compile.
const COUNTRY_NAMES: Record<EventCountry, Record<AppLocale, string>> = {
  de: {
    de: 'Deutschland',
    en: 'Germany',
    fr: 'Allemagne',
    pl: 'Niemcy',
    cs: 'Německo',
  },
  fr: {
    de: 'Frankreich',
    en: 'France',
    fr: 'France',
    pl: 'Francja',
    cs: 'Francie',
  },
  gb: {
    de: 'Großbritannien',
    en: 'Great Britain',
    fr: 'Grande-Bretagne',
    pl: 'Wielka Brytania',
    cs: 'Velká Británie',
  },
  pl: {
    de: 'Polen',
    en: 'Poland',
    fr: 'Pologne',
    pl: 'Polska',
    cs: 'Polsko',
  },
  cz: {
    de: 'Tschechien',
    en: 'Czech Republic',
    fr: 'République tchèque',
    pl: 'Czechy',
    cs: 'Česká republika',
  },
};

const country: ICustomQuestionTypeConfiguration = {
  name: 'country',
  title: 'Country',
  questionJSON: {
    type: 'dropdown',
    autocomplete: 'country',
    placeholder: {
      de: 'Ein Land auswählen...',
      en: 'Select a country...',
      fr: 'Sélectionnez un pays...',
      pl: 'Wybierz kraj...',
      cs: 'Vyberte zemi...',
    },
    // Only the countries the event runs in are offered.
    choices: EVENT_COUNTRIES.map((code) => ({
      value: code,
      text: COUNTRY_NAMES[code],
      visibleIf: `{event.countries} contains '${code}'`,
    })),
  },
};

export default country;
