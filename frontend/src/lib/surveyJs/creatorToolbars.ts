import type { SurveyCreatorModel } from 'survey-creator-core';
import type { Action } from 'survey-core';

/** Where an action is shown: the footer one is icon-only, opening upwards. */
export interface ToolbarPlacement {
  compact: boolean;
  verticalPosition: 'top' | 'bottom';
}

/**
 * Adds an action to the top toolbar and to the footer bar the creator shows
 * instead on narrow screens — one instance each, as a container restyles the
 * actions it holds.
 */
export function addToBothToolbars<T extends { action: Action }>(
  creator: SurveyCreatorModel,
  create: (placement: ToolbarPlacement) => T,
  at: 'start' | 'end',
): T[] {
  return (
    [
      [creator.toolbar, { compact: false, verticalPosition: 'bottom' }],
      [creator.footerToolbar, { compact: true, verticalPosition: 'top' }],
    ] as const
  ).map(([toolbar, placement]) => {
    const item = create(placement);
    if (at === 'start') {
      toolbar.actions.unshift(item.action);
    } else {
      toolbar.actions.push(item.action);
    }
    return item;
  });
}
