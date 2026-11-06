import { SurveyModel } from 'survey-core';
import type {
  EventDetails,
  Registration,
} from '@camp-registration/common/entities';
import {
  extractPaymentAmounts,
  setVariables,
} from '@camp-registration/common/form';
import { computeAmountDue } from '@camp-registration/common/utils';

/** What a survey's current answers cost, as the server computes it. */
export function surveyAmountDue(
  survey: SurveyModel,
  event: { price: number; currency: string },
): number {
  return computeAmountDue(event, extractPaymentAmounts(survey));
}

/**
 * What a stored registration's answers come to under the event's current
 * form and price, read in the locale and group it was submitted with.
 */
export function quoteRegistration(
  event: EventDetails,
  registration: Pick<Registration, 'data' | 'locale' | 'group'>,
): number {
  const survey = new SurveyModel(event.form);
  survey.locale = registration.locale;
  setVariables(survey, event, { group: registration.group });
  survey.data = registration.data;

  return surveyAmountDue(survey, event);
}
