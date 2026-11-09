import {
  type CalculatedValue,
  type ChoiceItem,
  type Question,
  QuestionBooleanModel,
  QuestionSelectBase,
  type SurveyModel,
} from 'survey-core';
import { PAYMENT_AMOUNT_TAG } from '../utils/amountDue.js';

/**
 * What the answers add to the event price, in major units, negative for a
 * discount. Shared so the registration form previews what the server charges.
 * - a visible question tagged `payment_amount`: its value;
 * - a visible boolean answered yes, or a visible selected choice: its `price`;
 * - a calculated value tagged `payment_amount`: its value, always (never shown).
 */
export function extractPaymentAmounts(survey: SurveyModel): number[] {
  // Nested: the questions of every dynamic panel entry, each its own answer.
  const questions = survey
    .getAllQuestions(false, false, true)
    .filter((question) => question.isVisibleInSurvey);
  const calculated = survey.calculatedValues.filter(isTagged);

  return [
    ...questions.flatMap(questionAmounts),
    ...calculated.map((item): unknown => item.value),
  ].map(toAmount);
}

function questionAmounts(question: Question): unknown[] {
  if (isTagged(question)) {
    return [question.value];
  }
  if (question instanceof QuestionBooleanModel) {
    return question.booleanValue === true ? [price(question)] : [];
  }
  if (question instanceof QuestionSelectBase) {
    // Visible choices only: one hidden by `choicesVisibleIf` doesn't count.
    return question.visibleChoices
      .filter((choice) => question.isItemSelected(choice))
      .map(price);
  }

  return [];
}

function isTagged(item: Question | CalculatedValue): boolean {
  return item.getPropertyValue('eventDataType') === PAYMENT_AMOUNT_TAG;
}

function price(item: Question | ChoiceItem): unknown {
  return item.getPropertyValue('price');
}

// Expressions may yield numeric strings; anything else adds nothing.
function toAmount(value: unknown): number {
  const amount = typeof value === 'string' ? Number(value) : value;

  return typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
}
