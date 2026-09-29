import { describe, expect, it } from 'vitest';
import { SurveyModel } from 'survey-core';
import { emphasizeForwardNavigation } from './navigation';

function mode(survey: SurveyModel, id: string) {
  return survey.navigationBar.getActionById(id)?.appearance?.mode;
}

describe('emphasizeForwardNavigation', () => {
  it('makes the forward buttons primary and leaves "Previous" alone', () => {
    const survey = new SurveyModel({
      pages: [
        { elements: [{ type: 'text', name: 'a' }] },
        { elements: [{ type: 'text', name: 'b' }] },
      ],
    });

    emphasizeForwardNavigation(survey);

    expect(mode(survey, 'sv-nav-start')).toBe('primary');
    expect(mode(survey, 'sv-nav-next')).toBe('primary');
    expect(mode(survey, 'sv-nav-preview')).toBe('primary');
    expect(mode(survey, 'sv-nav-complete')).toBe('primary');
    expect(mode(survey, 'sv-nav-prev')).toBeUndefined();
  });
});
