import { ICustomQuestionTypeConfiguration } from 'survey-core';

const role: ICustomQuestionTypeConfiguration = {
  name: 'role',
  title: 'Role',
  questionJSON: {
    type: 'dropdown',
    placeholder: {
      de: 'Rolle auswählen...',
      en: 'Select a role...',
      fr: 'Sélectionner un rôle...',
    },
    choices: [
      {
        value: 'participant',
        text: {
          de: 'Teilnehmer:in',
          en: 'Particiapnt',
          fr: 'Participant:e',
        },
      },
      {
        value: 'counselor',
        text: {
          de: 'Betreuer',
          en: 'Counselor',
          fr: 'Conseiller',
        },
      },
    ],
  },
};

export default role;
