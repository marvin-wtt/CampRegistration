import type {
  ICustomQuestionTypeConfiguration,
  ItemValue,
  Question,
} from 'survey-core';
import { Serializer } from 'survey-core';

type RoleQuestionConfiguration = ICustomQuestionTypeConfiguration & {
  initialChoices: ItemValue[];
  updateChoices: (question: Question, value: ItemValue[] | undefined) => void;
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
      pl: 'Wybierz rolkę...',
      cs: 'Vyberte roli...',
    },
    choices: [
      {
        value: 'participant',
        text: {
          de: 'Teilnehmer',
          en: 'Particiapnt',
          fr: 'Participant',
          pl: 'Uczestnicy',
          cs: 'Účastníci',
        },
      },
      {
        value: 'counselor',
        text: {
          de: 'Betreuer',
          en: 'Counselor',
          fr: 'Conseiller',
          pl: 'Opiekun',
          cs: 'Pečovatel',
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.initialChoices = question.customQuestion.json.questionJSON
      .choices as ItemValue[];

    this.updateChoices(question, question.roleChoices as ItemValue[]);
  },
  onPropertyChanged(question, propertyName, newValue: ItemValue[]) {
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    question.questionWrapper.choices = [...defaultValues, ...value];
  },
};

export default roleQuestion;
