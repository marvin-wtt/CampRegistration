import './md3-adapter.scss';
import type { ITheme } from 'survey-core';

export type Md3Mode = 'light' | 'dark';

/** The class SurveyJS puts on every survey root and on the Survey Creator root. */
const OVERRIDES_SELECTOR = '.sjs-theme-overrides';

let declarationCache: Record<string, string> | undefined;

/**
 * The adapter stylesheet's own declarations, read back out of the CSSOM.
 *
 * Reading them rather than restating them keeps this module free of a second
 * copy of the token map — `md3-adapter.scss` stays the only place it exists.
 */
function adapterDeclarations(): Record<string, string> {
  if (declarationCache) {
    return declarationCache;
  }

  const declarations: Record<string, string> = {};

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // Cross-origin stylesheet, so never ours.
      continue;
    }

    for (const rule of Array.from(rules)) {
      if (
        !(rule instanceof CSSStyleRule) ||
        rule.selectorText !== OVERRIDES_SELECTOR
      ) {
        continue;
      }

      for (const name of Array.from(rule.style)) {
        declarations[name] = rule.style.getPropertyValue(name).trim();
      }
    }
  }

  declarationCache = declarations;

  return declarations;
}

/**
 * Survey Creator normalises every colour it loads to `rgba(r, g, b, a)` before
 * diffing a theme against the one it was registered on top of (`getRGBaColor`).
 * Matching that spelling is what keeps an untouched MD3 theme reading as
 * unmodified, so opening the Themes tab does not autosave a frozen palette.
 */
function toRgba(color: string): string | undefined {
  const match = /^rgba?\(([^)]+)\)$/i.exec(color.trim());
  if (!match) {
    return undefined;
  }

  const channels = match[1]!
    .split(/[,/\s]+/)
    .filter(Boolean)
    .map(Number);

  if (channels.length < 3 || channels.slice(0, 3).some(Number.isNaN)) {
    return undefined;
  }

  const [r, g, b, a = 1] = channels;

  return `rgba(${String(r)}, ${String(g)}, ${String(b)}, ${String(a)})`;
}

/**
 * Resolves the adapter's colours for one palette by letting the browser do it.
 *
 * `q-light`/`q-dark` are how the Quasar app extension pins a subtree to one
 * palette (`body.body--dark .q-light` and its mirror), so the probe reports the
 * requested mode whichever one the page is currently in. Every colour is read
 * off a child's computed `color`, which forces `var()` and `color-mix()` down
 * to a plain `rgb()`; the whole set costs one style recalculation.
 *
 * Non-colour tokens pass through as declared — sizes and font stacks need no
 * resolving, and the radius ramp they reference only exists inside a rendered
 * survey.
 */
function resolvePalette(mode: Md3Mode): Record<string, string> {
  const declarations = adapterDeclarations();
  const colors = Object.keys(declarations).filter((name) =>
    name.includes('-color-'),
  );

  const probe = document.createElement('div');
  probe.className = `${mode === 'dark' ? 'q-dark' : 'q-light'} sd-theme-root sjs-theme-overrides`;
  probe.style.display = 'none';

  const cells = colors.map((name) => {
    const cell = document.createElement('span');
    cell.style.color = `var(${name})`;
    probe.append(cell);

    return cell;
  });

  document.body.append(probe);

  const resolved: Record<string, string> = { ...declarations };
  colors.forEach((name, index) => {
    const value = toRgba(window.getComputedStyle(cells[index]!).color);
    if (value) {
      resolved[name] = value;
    }
  });

  probe.remove();

  return resolved;
}

/**
 * The MD3 look as an `ITheme`, with every colour resolved for one palette.
 *
 * `SurveyPDF` needs an `ITheme` object rather than the adapter stylesheet,
 * because it resolves CSS on a detached div that never carries the
 * `sjs-theme-overrides` class. It does resolve `var()` and `color-mix()` itself,
 * so the values only have to be *pinned* to a palette — hence a mode rather than
 * the page's live one, which would print a dark form for a dark-mode viewer.
 *
 * Survey Creator's Theme Editor is the other consumer this shape serves, and
 * takes it unchanged whenever `showThemeTab` is turned back on.
 *
 * Kept as a plain object rather than importing `ITheme` from `survey-core`, so
 * the module stays free of that dependency; the shape is structurally
 * compatible.
 */
export function buildMd3LiteralTheme(mode: Md3Mode = 'light'): ITheme {
  return {
    themeName: 'Standard',
    colorPalette: mode,
    // `isPanelless` is not a CSS variable — it drives `SurveyModel.isCompact`,
    // so the adapter stylesheet cannot express it and an unthemed survey falls
    // back to SurveyJS's panelled default. Matching that here keeps the Theme
    // Editor preview honest about what a camp without a saved theme renders as.
    isPanelless: true,
    // No `header` key: `SurveyModel._applyTheme` reads `"header" in theme` as an
    // opt-in and forces `headerView: "advanced"` on every survey it is applied
    // to. The header's *colours* come through `cssVariables` like any other
    // token; its geometry stays the director's choice.
    cssVariables: {
      ...resolvePalette(mode),
      // FIXME https://github.com/surveyjs/survey-library/pull/11804
      '--sjs2-layout-component-panel-header-padding-left':
        'var(--sjs2-spacing-x000)',
      '--sjs2-layout-component-panel-header-padding-right':
        'var(--sjs2-spacing-x000)',
      '--sjs2-layout-component-panel-content-area-padding-horizontal':
        'var(--sjs2-spacing-x000)',
    },
  };
}

/**
 * Picks the theme a camp's survey should render with for one palette: the
 * camp's own saved theme for that mode, its saved light theme as a dark-mode
 * stand-in, or the resolved MD3 default.
 *
 * Shared so every surface that renders a camp's survey — the registration
 * page, the Survey Creator's designer/preview tabs — agrees on the same
 * theme for the same event and mode. Picking it independently in more than
 * one place is how the registration page and the designer preview drifted
 * apart before: `--sjs2-*` values `applyTheme()` sets land on the survey
 * root as inline styles, which beat `.sjs-theme-overrides`, so two different
 * theme objects render two different results even though the adapter
 * stylesheet is identical in both places.
 */
export function resolveMd3Theme(
  themes: Record<string, ITheme>,
  mode: Md3Mode,
): ITheme {
  return (
    themes[mode] ??
    (mode === 'dark' ? themes.light : undefined) ??
    buildMd3LiteralTheme(mode)
  );
}
