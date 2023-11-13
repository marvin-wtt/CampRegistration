import {
  ICustomQuestionTypeConfiguration,
  Question,
  Serializer,
} from 'survey-core';

type RoleQuestionConfiguration = ICustomQuestionTypeConfiguration & {
  initialChoices: unknown[];
  updateChoices: (question: Question, value: unknown[]) => void;
};

const roleQuestion: RoleQuestionConfiguration = {
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
  initialChoices: [],
  onInit() {
    Serializer.addProperty('role', {
      name: 'roleChoices',
      type: 'itemvalues',
      default: [],
      isRequired: false,
      category: 'choices',
      visibleIndex: 3,
    });
  },
  onLoaded(question) {
    this.initialChoices = question.customQuestion.json.questionJSON.choices;

    this.updateChoices(question, question.roleChoices as unknown[]);
  },
  onPropertyChanged(question, propertyName, newValue) {
    if (propertyName === 'roleChoices') {
      this.updateChoices(question, newValue);
    }
  },
  updateChoices(question, value) {
    question.customQuestion.json.questionJSON.choices = [
      ...this.initialChoices,
      ...value,
    ];
  },
};

export default roleQuestion;
