import type {
  ICustomQuestionTypeConfiguration,
  ItemValue,
  Question,
} from 'survey-core';
// import pkg from 'survey-core';
const { Serializer } = await import('survey-core');

type RoleQuestionConfiguration = ICustomQuestionTypeConfiguration & {
  initialChoices: ItemValue[];
  updateChoices: (question: Question, value: ItemValue[]) => void;
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
          de: 'Teilnehmer',
          en: 'Particiapnt',
          fr: 'Participant',
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

    this.updateChoices(question, question.roleChoices as ItemValue[]);
  },
  onPropertyChanged(question, propertyName, newValue) {
    if (propertyName === 'roleChoices') {
      this.updateChoices(question, newValue);
    }
  },
  updateChoices(question, value) {
    if (!value) {
      return;
    }

    // Allow user to override the initial value with custom labels
    const defaultValues = this.initialChoices.filter(
      (item) => !value.some((it) => it.value === item.value),
    );
    question.questionWrapper.choices = [...defaultValues, ...value];
  },
};

export default roleQuestion;
