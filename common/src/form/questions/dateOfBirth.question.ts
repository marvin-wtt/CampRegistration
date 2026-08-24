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
    // NOTE: `{camp.maxAge}`/`{camp.minAge}` are SurveyJS variable references set
    // by `setVariables()` (common/src/form/variables/variables.ts) — the `camp.`
    // prefix is a wire-level key baked into saved form JSON and must not be
    // renamed, even though the surrounding prose now says "event".
    minErrorText: {
      de: 'Das maximale Alter für diese Veranstaltung beträgt {camp.maxAge} Jahre',
      en: 'The maximum age for this event is {camp.maxAge} years',
      fr: "L'âge maximum pour cet événement est de {camp.maxAge} ans",
      pl: 'Maksymalny wiek uczestników wydarzenia wynosi {camp.maxAge} lat',
      cs: 'Maximální věk pro účast na této akci je {camp.maxAge} let',
    },
    maxErrorText: {
      de: 'Das Mindestalter für diese Veranstaltung beträgt {camp.minAge} Jahre',
      en: 'The minimum age for this event is {camp.minAge} years',
      fr: "L'âge minimum pour cet événement est de {camp.minAge} ans",
      pl: 'Minimalny wiek uczestników wydarzenia wynosi {camp.minAge} lat',
      cs: 'Minimální věk pro účast na této akci je {camp.minAge} let',
    },
  },
};

export default dateOfBirth;
