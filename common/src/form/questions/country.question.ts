import { ICustomQuestionTypeConfiguration } from 'survey-core';

const country: ICustomQuestionTypeConfiguration = {
  name: 'country',
  title: 'Country',
  questionJSON: {
    type: 'dropdown',
    autocomplete: 'countryQuestion',
    placeholder: {
      de: 'Ein Land auswählen...',
      en: 'Select a countryQuestion...',
      fr: 'Sélectionnez un pays...',
      pl: 'Wybierz kraj...',
      cs: 'Vyberte zemi...',
    },
    choices: [
      {
        value: 'de',
        text: {
          de: 'Deutschland',
          en: 'Germany',
          fr: 'Allemagne',
          pl: 'Niemcy',
          cs: 'Německo',
        },
        visibleIf: "{event.countries} contains 'de'",
      },
      {
        value: 'fr',
        text: {
          de: 'Frankreich',
          en: 'France',
          fr: 'France',
          pl: 'Francja',
          cs: 'Francie',
        },
        visibleIf: "{event.countries} contains 'fr'",
      },
      {
        value: 'gb',
        text: {
          de: 'Großbritannien',
          en: 'Great Britain',
          fr: 'Grande-Bretagne',
          pl: 'Wielka Brytania',
          cs: 'Velká Británie',
        },
        visibleIf: "{event.countries} contains 'gb'",
      },
      {
        value: 'pl',
        text: {
          de: 'Polen',
          en: 'Poland',
          fr: 'Pologne',
          pl: 'Polska',
          cs: 'Polsko',
        },
        visibleIf: "{event.countries} contains 'pl'",
      },
      {
        value: 'cz',
        text: {
          de: 'Tschechien',
          en: 'Czech Republic',
          fr: 'République tchèque',
          pl: 'Czechy',
          cs: 'Česká republika',
        },
        visibleIf: "{event.countries} contains 'cz'",
      },
    ],
  },
};

export default country;
