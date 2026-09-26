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
      'iif({_validationEnabled}, htmlDate(subtractYears({event.endAt}, {event.maxAge} + 1)), "")',
    maxValueExpression:
      'iif({_validationEnabled}, htmlDate(subtractYears({event.startAt}, {event.minAge})), "")',
    // `{event.maxAge}`/`{event.minAge}` are SurveyJS variable references set by
    // `setVariables()` (common/src/form/variables/variables.ts).
    minErrorText: {
      de: 'Das maximale Alter für diese Veranstaltung beträgt {event.maxAge} Jahre',
      en: 'The maximum age for this event is {event.maxAge} years',
      fr: "L'âge maximum pour cet événement est de {event.maxAge} ans",
      pl: 'Maksymalny wiek uczestników wydarzenia wynosi {event.maxAge} lat',
      cs: 'Maximální věk pro účast na této akci je {event.maxAge} let',
    },
    maxErrorText: {
      de: 'Das Mindestalter für diese Veranstaltung beträgt {event.minAge} Jahre',
      en: 'The minimum age for this event is {event.minAge} years',
      fr: "L'âge minimum pour cet événement est de {event.minAge} ans",
      pl: 'Minimalny wiek uczestników wydarzenia wynosi {event.minAge} lat',
      cs: 'Minimální věk pro účast na této akci je {event.minAge} let',
    },
  },
};

export default dateOfBirth;
