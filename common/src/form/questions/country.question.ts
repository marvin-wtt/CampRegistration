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
        visibleIf: "{camp.countries} contains 'de'",
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
        visibleIf: "{camp.countries} contains 'fr'",
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
        visibleIf: "{camp.countries} contains 'pl'",
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
        visibleIf: "{camp.countries} contains 'cz'",
      },
    ],
  },
};

export default country;
