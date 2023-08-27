import { ICustomQuestionTypeConfiguration } from 'survey-core';

const country: ICustomQuestionTypeConfiguration = {
  name: 'country',
  title: 'Country',
  questionJSON: {
    type: 'dropdown',
    autocomplete: 'country',
    placeholder: {
      en: 'Select a country...',
    },
    choices: [
      {
        value: 'de',
        text: {
          de: 'Deutschland',
          en: 'Germany',
          fr: 'Allemagne',
        },
        visibleIf: "{camp.countries} contains 'de'",
      },
      {
        value: 'fr',
        text: {
          de: 'Frankreich',
          en: 'France',
          fr: 'France',
        },
        visibleIf: "{camp.countries} contains 'fr'",
      },
    ],
  },
};

export default country;
