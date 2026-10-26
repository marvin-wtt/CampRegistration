import { reactive } from 'vue';
import type { SurveyModel } from 'survey-core';
import { ComponentFactory } from 'survey-vue3-ui';
import { extractPaymentAmounts } from '@camp-registration/common/form';
import { computeAmountDue } from '@camp-registration/common/utils';
import { setCompleteTextDefault } from '@/lib/surveyJs/completeText';
import RegistrationAmountSummary from '@/components/common/RegistrationAmountSummary.vue';

const SUMMARY_COMPONENT = 'cr-registration-amount-summary';

ComponentFactory.Instance.registerComponent(
  SUMMARY_COMPONENT,
  RegistrationAmountSummary,
);

export interface AmountDueState {
  /** Minor units of `currency`. */
  amount: number;
  currency: string;
  lastPage: boolean;
}

/**
 * Follows what the current answers will cost, with the same computation the
 * server charges by, and keeps the Complete button's default label in step:
 * a free event whose priced options get picked becomes a paid registration.
 * Hidden questions don't count, here or on the server.
 */
export function trackAmountDue(
  survey: SurveyModel,
  event: { price: number; currency: string },
): AmountDueState {
  const state = reactive<AmountDueState>({
    amount: 0,
    currency: event.currency,
    lastPage: false,
  });

  const update = () => {
    state.amount = computeAmountDue(event, extractPaymentAmounts(survey));
    state.lastPage = survey.isLastPage;
    setCompleteTextDefault(survey, state.amount > 0);
  };

  update();
  survey.onValueChanged.add(update);
  survey.onCurrentPageChanged.add(update);
  // Event variables (`{event.price}`) feed price expressions.
  survey.onVariableChanged.add(update);
  // Page visibility decides which page is the last one.
  survey.onPageVisibleChanged.add(update);

  return state;
}

/**
 * Shows the total directly above the navigation on the last page — the
 * price has to be presented right before the person commits to paying it.
 */
export function addAmountSummary(
  survey: SurveyModel,
  state: AmountDueState,
): void {
  survey.addLayoutElement({
    id: 'amount-summary',
    container: 'contentBottom',
    component: SUMMARY_COMPONENT,
    data: state,
    // Ahead of the navigation buttons, which carry no index.
    index: -1,
  });
}
