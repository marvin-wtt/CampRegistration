import {
  type Question,
  QuestionBooleanModel,
  QuestionSelectBase,
  type SurveyModel,
} from 'survey-core';
import { PAYMENT_AMOUNT_TAG } from '../utils/amountDue.js';

/**
 * What the answers add to the event price, in major units — negative for a
 * discount: questions tagged `payment_amount`, and the `price` of a selected
 * choice or of a boolean answered yes. Only visible questions count, the price
 * being what the registrant sees. Shared so the registration form previews
 * what the server charges.
 */
export function extractPaymentAmounts(survey: SurveyModel): unknown[] {
  // Nested: the questions of every dynamic panel entry, each its own answer.
  return survey
    .getAllQuestions(false, false, true)
    .filter((question) => question.isVisibleInSurvey)
    .flatMap(questionAmounts);
}

function questionAmounts(question: Question): unknown[] {
  if (question.getPropertyValue('eventDataType') === PAYMENT_AMOUNT_TAG) {
    return [question.value];
  }
  if (question instanceof QuestionBooleanModel) {
    return question.booleanValue === true
      ? [question.getPropertyValue('price')]
      : [];
  }
  if (question instanceof QuestionSelectBase) {
    // Visible choices only: one hidden by `choicesVisibleIf` doesn't count.
    return question.visibleChoices
      .filter((item) => question.isItemSelected(item))
      .map((item): unknown => item.getPropertyValue('price'));
  }

  return [];
}
