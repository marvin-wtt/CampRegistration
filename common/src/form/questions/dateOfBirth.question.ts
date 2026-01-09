import { ICustomQuestionTypeConfiguration } from 'survey-core';

const dateOfBirth: ICustomQuestionTypeConfiguration = {
  name: 'date_of_birth',
  title: 'Date of Birth',
  inheritBaseProps: true,
  questionJSON: {
    type: 'text',
    inputType: 'date',
    autocomplete: 'bday',
    minValueExpression:
      'iif({_validationEnabled}, htmlDate(subtractYears({camp.endAt}, {camp.maxAge} + 1)), "")',
    maxValueExpression:
      'iif({_validationEnabled}, htmlDate(subtractYears({camp.startAt}, {camp.minAge})), "")',
    minErrorText: {
      de: 'Das maximale Alter für dieses Camp ist {camp.maxAge} Jahre',
      en: 'The maximum age for this camp is {camp.maxAge} years',
      fr: "L'âge maximum pour ce camp est de {camp.maxAge} ans",
      pl: 'Maksymalny wiek uczestników obozu wynosi {camp.maxAge} lat',
      cs: 'Maximální věk pro účast na tomto táboře je {camp.maxAge} let',
    },
    maxErrorText: {
      de: 'Das Mindestalter für das Camp ist {camp.minAge} Jahre',
      en: 'The minimum age for this camp is {camp.minAge} years',
      fr: "L'âge minimum pour le camp est de {camp.minAge} ans",
      pl: 'Minimalny wiek uczestników obozu wynosi {camp.minAge} lat',
      cs: 'Minimální věk pro účast na táboře je {camp.minAge} let',
    },
  },
};

export default dateOfBirth;
