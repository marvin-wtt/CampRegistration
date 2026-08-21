import type { ITheme } from 'survey-core';

/**
 * The one theme every form renders with.
 *
 * Colours come from `md3-adapter.scss` through the `.sjs-theme-overrides`
 * class, so this carries only what a stylesheet cannot express:
 *
 * - `headerView: "advanced"` switches on the branded `primary` band. Setting it
 *   is enough on its own — the property's `onSet` inserts the `Cover` layout
 *   element — and the Cover's own defaults (auto height, left-aligned title,
 *   description beneath) are already what MD3 wants, so no `header` block is
 *   needed.
 * - `isPanelless` drives `SurveyModel.isCompact`, which has no token.
 *
 * Deliberately no `cssVariables`: `Cover.fromTheme` copies the three header
 * colour tokens onto the model as inline styles when they are present, which
 * would freeze the band to one palette instead of letting it follow the
 * viewer's light/dark setting.
 *
 * Applied identically to the public camp page and to the Survey Creator, which
 * is what keeps the designer and preview looking like the real thing. Camps
 * keep their own stored `themes` rows, but nothing reads them while the Themes
 * tab is disabled.
 */
export const corporateTheme: ITheme = {
  headerView: 'advanced',
  isPanelless: false,
};
