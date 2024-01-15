import { ICustomQuestionTypeConfiguration } from 'survey-core';

const dateOfBirth: ICustomQuestionTypeConfiguration = {
  name: 'date_of_birth',
  title: 'Date of Birth',
  questionJSON: {
    type: 'text',
    inputType: 'date',
    autocomplete: 'bday',
    minValueExpression:
      'htmlDate(subtractYears({camp.endAt}, {camp.maxAge} + 1))',
    maxValueExpression:
      'htmlDate(subtractYears({camp.startAt}, {camp.minAge}))',
    minErrorText: {
      de: 'Das maximale Alter für dieses Camp ist {camp.maxAge} Jahre',
      en: 'The maximum age for this camp is {camp.maxAge} years',
      fr: "L'âge maximum pour ce camp est de {camp.maxAge} ans.",
    },
    maxErrorText: {
      de: 'Das Mindestalter für das Camp ist {camp.minAge} Jahre',
      en: 'The minimum age for this camp is {camp.minAge} years',
      fr: "L'âge minimum pour le camp est de {camp.minAge} ans",
    },
  },
};

export default dateOfBirth;
