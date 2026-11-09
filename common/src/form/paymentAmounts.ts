import {
  type CalculatedValue,
  type ChoiceItem,
  type Question,
  QuestionBooleanModel,
  QuestionExpressionModel,
  QuestionSelectBase,
  type SurveyModel,
} from 'survey-core';
import { PAYMENT_AMOUNT_TAG } from '../utils/amountDue.js';

/**
 * What the answers add to the event price, in major units, negative for a
 * discount. Only elements tagged `payment_amount` count, so a stray `price`
 * on an untagged question never charges anything. Shared so the registration
 * form previews what the server charges.
 * - a visible tagged boolean answered yes: its `price`;
 * - a visible tagged select question: the `price` of each selected choice;
 * - a visible tagged expression: its value;
 * - a tagged calculated value: its value, always (never shown).
 * Never a typed answer: the registrant would set their own price.
 */
export function extractPaymentAmounts(survey: SurveyModel): number[] {
  // Nested: the questions of every dynamic panel entry, each its own answer.
  const questions = survey
    .getAllQuestions(false, false, true)
    .filter(isTagged)
    .filter((question) => question.isVisibleInSurvey);

  const calculated = survey.calculatedValues.filter(isTagged);

  return [
    ...questions.flatMap(questionAmounts),
    ...calculated.map((item): unknown => item.value),
  ].map(toAmount);
}

function questionAmounts(question: Question): unknown[] {
  if (question instanceof QuestionBooleanModel) {
    return question.booleanValue === true ? [price(question)] : [];
  }
  if (question instanceof QuestionSelectBase) {
    // Visible choices only: one hidden by `choicesVisibleIf` doesn't count.
    return question.visibleChoices
      .filter((choice) => question.isItemSelected(choice))
      .map(price);
  }
  if (question instanceof QuestionExpressionModel) {
    return [question.value];
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
