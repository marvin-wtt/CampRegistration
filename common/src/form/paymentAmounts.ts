import {
  type Question,
  QuestionBooleanModel,
  QuestionExpressionModel,
  QuestionSelectBase,
  type SurveyModel,
} from 'survey-core';
import { isPriced, priceOf } from './properties/accessors.js';

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
    .filter(isPriced)
    .filter((question) => question.isVisibleInSurvey);

  const calculated = survey.calculatedValues.filter(isPriced);

  return [
    ...questions.flatMap(questionAmounts),
    ...calculated.map((item): unknown => item.value),
  ].map(toAmount);
}

function questionAmounts(question: Question): unknown[] {
  if (question instanceof QuestionBooleanModel) {
    return question.booleanValue === true ? [priceOf(question)] : [];
  }
  if (question instanceof QuestionSelectBase) {
    // Visible choices only: one hidden by `choicesVisibleIf` doesn't count.
    return question.visibleChoices
      .filter((choice) => question.isItemSelected(choice))
      .map(priceOf);
  }
  if (question instanceof QuestionExpressionModel) {
    return [question.value];
  }

  return [];
}

// Expressions may yield numeric strings; anything else adds nothing.
function toAmount(value: unknown): number {
  const amount = typeof value === 'string' ? Number(value) : value;

  return typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
}
