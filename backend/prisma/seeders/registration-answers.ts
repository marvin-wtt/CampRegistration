import { faker } from '@faker-js/faker/locale/en';
import moment from 'moment';
import { SurveyModel } from 'survey-core';
import type {
  ItemValue,
  Question,
  QuestionPanelDynamicModel,
  QuestionSelectBase,
  QuestionTextModel,
} from 'survey-core';
import { setVariables } from '@camp-registration/common/form';
import type { Camp } from '#generated/prisma/client.js';

/** A registrant as the seeder invents them, before any form is involved. */
export interface Registrant {
  role: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: Date;
  email: string;
  phoneNumber: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  guardians: { firstName: string; lastName: string; email: string }[];
  emergencyContacts: { description: string; phoneNumber: string }[];
  medicalRestrictions: string;
  foodIntolerance: string;
  additionalInformation: string;
}

/** A file question of the form, answered once the upload exists. */
export interface FileField {
  valueName: string;
  multiple: boolean;
}

/**
 * The registrant's answers, keyed by the value name a form stores them under.
 * A camp may ask for any subset of these; what is not covered here is invented
 * from the question itself, so a hand-written form still gets a plausible
 * answer.
 */
function answerBook(registrant: Registrant): Record<string, unknown> {
  const guardian = registrant.guardians[0];

  return {
    role: registrant.role,
    first_name: registrant.firstName,
    last_name: registrant.lastName,
    gender: registrant.gender,
    date_of_birth: moment(registrant.dateOfBirth).format('YYYY-MM-DD'),
    address: {
      address: registrant.street,
      zip_code: registrant.zipCode,
      city: registrant.city,
      country: registrant.country,
    },
    // Forms that ask for the parts of an address separately
    street: registrant.street,
    zip_code: registrant.zipCode,
    city: registrant.city,
    country: registrant.country,
    email: registrant.email,
    phone_number: registrant.phoneNumber,
    guardian_first_name: guardian?.firstName,
    guardian_last_name: guardian?.lastName,
    guardian_email: guardian?.email,
    medical_restrictions: registrant.medicalRestrictions,
    food_intolerance: registrant.foodIntolerance,
    additional_information: registrant.additionalInformation,
    // Only ever visible when the camp is full for the registrant's country
    waiting_list: true,
  };
}

/** Rows for the dynamic panels the presets and the flagship form use. */
const PANEL_ROWS: Record<
  string,
  (registrant: Registrant) => Record<string, unknown>[]
> = {
  guardian: (registrant) =>
    registrant.guardians.map((guardian) => ({
      first_name: guardian.firstName,
      last_name: guardian.lastName,
      guardian_first_name: guardian.firstName,
      guardian_last_name: guardian.lastName,
      email: guardian.email,
    })),
  emergency_contacts: (registrant) =>
    registrant.emergencyContacts.map((contact) => ({
      description: contact.description,
      emergency_contact_description: contact.description,
      phone_number: contact.phoneNumber,
      guardian_phone_number: contact.phoneNumber,
    })),
};

/**
 * Fills the camp's own registration form with the registrant's answers: every
 * question the form shows this registrant gets a value and nothing else does,
 * so the stored blob is what the survey would have submitted.
 */
export function buildRegistrationData(
  camp: Camp,
  registrant: Registrant,
  options: { waitingList?: boolean } = {},
): { data: Record<string, unknown>; fileFields: FileField[] } {
  const survey = new SurveyModel(camp.form);
  survey.locale = 'en-US';
  setVariables(survey, {
    ...camp,
    freePlaces: freePlacesFor(camp, options.waitingList ?? false),
  } as Parameters<typeof setVariables>[1]);

  const book = answerBook(registrant);
  const fileFields: FileField[] = [];

  // Document order is dependency order: a question that reveals later ones
  // (role, date of birth, country) is answered before those are checked.
  for (const question of survey.getAllQuestions()) {
    if (!question.isVisible || !question.isParentVisible) {
      continue;
    }

    if (question.getType() === 'file') {
      fileFields.push({
        valueName: question.getValueName(),
        multiple: !!(question as unknown as { allowMultiple?: boolean })
          .allowMultiple,
      });
      continue;
    }

    const answer = answerFor(question, book, registrant);
    if (answer !== undefined) {
      question.value = answer;
    }
  }

  return { data: survey.data as Record<string, unknown>, fileFields };
}

/**
 * Free places as the public form would see them. Zero reveals the waiting-list
 * question, which is the only way a waitlisted registration can confirm it.
 */
export function freePlacesFor(
  camp: Camp,
  waitingList: boolean,
): number | Record<string, number> {
  const places = waitingList ? 0 : 5;

  return typeof camp.maxParticipants === 'number'
    ? places
    : Object.fromEntries(camp.countries.map((country) => [country, places]));
}

function answerFor(
  question: Question,
  book: Record<string, unknown>,
  registrant: Registrant,
): unknown {
  const valueName = question.getValueName();
  if (valueName in book) {
    return book[valueName];
  }

  // A dynamic panel renders its minimum number of panels whether or not it was
  // answered, so leaving one blank means empty rows of required fields.
  if (question.getType() === 'paneldynamic') {
    return panelAnswer(question as QuestionPanelDynamicModel, book, registrant);
  }

  // Optional questions nobody thought of are left blank now and then
  if (!question.isRequired && faker.datatype.boolean(0.3)) {
    return undefined;
  }

  switch (question.getType()) {
    case 'country':
      return registrant.country;
    case 'boolean':
      return demandsTrue(question) ? true : faker.datatype.boolean();
    case 'checkbox':
      return faker.helpers.arrayElements(choiceValues(question), {
        min: 1,
        max: 2,
      });
    case 'dropdown':
    case 'radiogroup':
    case 'buttongroup':
    case 'imagepicker':
    case 'role':
      return faker.helpers.arrayElement(choiceValues(question));
    case 'rating':
      return faker.number.int({ min: 1, max: 5 });
    case 'comment':
      return faker.lorem.sentence();
    case 'text':
      return textAnswer(question as QuestionTextModel);
    default:
      // Expressions, html and anything else that cannot be answered sensibly
      return undefined;
  }
}

function panelAnswer(
  question: QuestionPanelDynamicModel,
  book: Record<string, unknown>,
  registrant: Registrant,
): Record<string, unknown>[] {
  const rows = PANEL_ROWS[question.getValueName()]?.(registrant);
  const count =
    rows?.length ?? Math.max(question.panelCount, question.minPanelCount, 1);

  return Array.from({ length: count }, (_, index) => {
    const row = { ...book, ...rows?.[index] };

    return Object.fromEntries(
      question.template.questions
        .map((entry) => [
          entry.getValueName(),
          answerFor(entry, row, registrant),
        ])
        .filter(([, answer]) => answer !== undefined),
    ) as Record<string, unknown>;
  });
}

/**
 * The consents and confirmations a form gates submission on: they all carry an
 * expression validator demanding the answer be true.
 */
function demandsTrue(question: Question): boolean {
  return question.validators.some(
    (validator) => validator.getType() === 'expressionvalidator',
  );
}

function choiceValues(question: Question): unknown[] {
  const choices = (question as QuestionSelectBase).visibleChoices as
    ItemValue[] | undefined;

  return (choices ?? []).map((choice) => choice.value as unknown);
}

function textAnswer(question: QuestionTextModel): unknown {
  switch (question.inputType) {
    case 'date':
      return moment(faker.date.past()).format('YYYY-MM-DD');
    case 'email':
      return faker.internet.email();
    case 'tel':
      return faker.phone.number();
    case 'url':
      return faker.internet.url();
    case 'number':
      return faker.number.int({ min: 1, max: 100 });
    default:
      return faker.lorem.words({ min: 1, max: 3 });
  }
}
