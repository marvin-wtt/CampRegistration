import type { SurveyModel } from 'survey-core';

// Every button that moves the registrant forward. Only one is visible at a
// time; "Complete" is already primary in survey-core.
const FORWARD_ACTION_IDS = ['sv-nav-start', 'sv-nav-next', 'sv-nav-preview'];

/**
 * Gives the forward navigation buttons the filled primary style of "Complete",
 * so each page has one clear next step and "Previous" stays outlined.
 */
export function emphasizeForwardNavigation(survey: SurveyModel): void {
  for (const id of FORWARD_ACTION_IDS) {
    const action = survey.navigationBar.getActionById(id);
    if (action) {
      action.appearance = { ...action.appearance, mode: 'primary' };
    }
  }
}
