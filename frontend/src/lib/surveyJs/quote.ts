import type { SurveyModel } from 'survey-core';
import type { PerGroup } from '@camp-registration/common/entities';
import { extractPaymentAmounts } from '@camp-registration/common/form';
import { computeAmountDue } from '@camp-registration/common/utils';

/**
 * What a survey's current answers cost, as the server computes it: at the
 * price of the group `setVariables` gave the survey.
 */
export function surveyAmountDue(
  survey: SurveyModel,
  event: { price: PerGroup<number>; currency: string },
): number {
  const group: unknown = survey.getVariable('event.group');

  return computeAmountDue(
    event,
    extractPaymentAmounts(survey),
    typeof group === 'string' ? group : null,
  );
}
