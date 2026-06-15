import type { ITheme } from 'survey-core';

export interface CThemes {
  light: ITheme;
  dark: ITheme;
}

type Md3Mode = 'light' | 'dark';

/**
 * Strategy for turning an MD3 design token into a concrete CSS value.
 *
 * Two implementations exist:
 * - `varResolver` emits `var(--md3-*)` references so the rendered survey
 *   follows the live MD3 palette of the surrounding app.
 * - `createStaticResolver()` reads the computed `--md3-*` values off the
 *   document once and bakes them into literal colors. The SurveyJS theme
 *   editor parses color values back into its pickers/sliders and chokes on
 *   `var()` / `color-mix()` expressions, so it must be fed literals.
 */
interface Md3Resolver {
  /** A solid color token. */
  color(token: string, mode: Md3Mode, fallback: string): string;
  /** A token rendered with the given opacity. */
  rgba(
    token: string,
    mode: Md3Mode,
    fallbackRgb: string,
    opacity: number,
  ): string;
  /** A token tinted down to `percent` opacity over a transparent base. */
  mix(token: string, mode: Md3Mode, fallback: string, percent: number): string;
}

const varResolver: Md3Resolver = {
  color: (token, mode, fallback) =>
    `var(--md3-${token}--${mode}, var(--md3-${token}, ${fallback}))`,
  rgba: (token, mode, fallbackRgb, opacity) =>
    `rgba(var(--md3-${token}-rgb--${mode}, ${fallbackRgb}), ${opacity})`,
  mix: (token, mode, fallback, percent) =>
    `color-mix(in srgb, var(--md3-${token}--${mode}, var(--md3-${token}, ${fallback})) ${percent}%, transparent)`,
};

const readCssVar = (name: string): string => {
  if (typeof document === 'undefined') {
    return '';
  }
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
};

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const parseColor = (input: string): Rgba | null => {
  const s = input.trim();

  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    if (hex.length !== 6 && hex.length !== 8) {
      return null;
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
    };
  }

  const match = s.match(/rgba?\(([^)]+)\)/i);
  if (match?.[1]) {
    const parts = match[1].split(/[,/\s]+/).filter(Boolean);
    if (parts.length < 3) {
      return null;
    }
    return {
      r: parseFloat(parts[0]!),
      g: parseFloat(parts[1]!),
      b: parseFloat(parts[2]!),
      a: parts[3] !== undefined ? parseFloat(parts[3]) : 1,
    };
  }

  return null;
};

const round = (value: number) => Math.round(value * 1000) / 1000;

const toRgba = (color: string, alpha: number): string => {
  const c = parseColor(color);
  if (!c) {
    return color;
  }
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${round(c.a * alpha)})`;
};

/**
 * Resolve `--md3-*` tokens to literal colors using the values currently
 * computed on the document. Both `--md3-<token>--light` and `--*--dark` are
 * defined globally, so a single read produces a complete frozen snapshot for
 * either palette regardless of the active mode.
 */
const createStaticResolver = (): Md3Resolver => {
  const resolveToken = (token: string, mode: Md3Mode, fallback: string) =>
    readCssVar(`--md3-${token}--${mode}`) ||
    readCssVar(`--md3-${token}`) ||
    fallback;

  return {
    color: resolveToken,
    rgba: (token, mode, fallbackRgb, opacity) => {
      const triple = readCssVar(`--md3-${token}-rgb--${mode}`) || fallbackRgb;
      return `rgba(${triple}, ${opacity})`;
    },
    mix: (token, mode, fallback, percent) =>
      toRgba(resolveToken(token, mode, fallback), percent / 100),
  };
};

const surfaceShadow = (r: Md3Resolver, mode: Md3Mode, opacity: number) => {
  return `0px 1px 2px 0px ${r.rgba('shadow', mode, '0, 0, 0', opacity)}`;
};

const commonCssVariables = {
  '--sjs-base-unit': '8px',
  '--sjs-corner-radius': '12px',

  // MD3 type scale-ish defaults
  '--sjs-font-family':
    'Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  '--sjs-font-size': '16px',

  '--sjs-article-font-xx-large-fontSize': '57px',
  '--sjs-article-font-xx-large-lineHeight': '64px',
  '--sjs-article-font-xx-large-fontWeight': '400',
  '--sjs-article-font-xx-large-letterSpacing': '0',
  '--sjs-article-font-xx-large-textDecoration': 'none',
  '--sjs-article-font-xx-large-fontStyle': 'normal',
  '--sjs-article-font-xx-large-fontStretch': 'normal',
  '--sjs-article-font-xx-large-paragraphIndent': '0px',
  '--sjs-article-font-xx-large-textCase': 'none',

  '--sjs-article-font-x-large-fontSize': '45px',
  '--sjs-article-font-x-large-lineHeight': '52px',
  '--sjs-article-font-x-large-fontWeight': '400',
  '--sjs-article-font-x-large-letterSpacing': '0',
  '--sjs-article-font-x-large-textDecoration': 'none',
  '--sjs-article-font-x-large-fontStyle': 'normal',
  '--sjs-article-font-x-large-fontStretch': 'normal',
  '--sjs-article-font-x-large-paragraphIndent': '0px',
  '--sjs-article-font-x-large-textCase': 'none',

  '--sjs-article-font-large-fontSize': '32px',
  '--sjs-article-font-large-lineHeight': '40px',
  '--sjs-article-font-large-fontWeight': '400',
  '--sjs-article-font-large-letterSpacing': '0',
  '--sjs-article-font-large-textDecoration': 'none',
  '--sjs-article-font-large-fontStyle': 'normal',
  '--sjs-article-font-large-fontStretch': 'normal',
  '--sjs-article-font-large-paragraphIndent': '0px',
  '--sjs-article-font-large-textCase': 'none',

  '--sjs-article-font-medium-fontSize': '22px',
  '--sjs-article-font-medium-lineHeight': '28px',
  '--sjs-article-font-medium-fontWeight': '400',
  '--sjs-article-font-medium-letterSpacing': '0',
  '--sjs-article-font-medium-textDecoration': 'none',
  '--sjs-article-font-medium-fontStyle': 'normal',
  '--sjs-article-font-medium-fontStretch': 'normal',
  '--sjs-article-font-medium-paragraphIndent': '0px',
  '--sjs-article-font-medium-textCase': 'none',

  '--sjs-article-font-default-fontSize': '16px',
  '--sjs-article-font-default-lineHeight': '24px',
  '--sjs-article-font-default-fontWeight': '400',
  '--sjs-article-font-default-letterSpacing': '0',
  '--sjs-article-font-default-textDecoration': 'none',
  '--sjs-article-font-default-fontStyle': 'normal',
  '--sjs-article-font-default-fontStretch': 'normal',
  '--sjs-article-font-default-paragraphIndent': '0px',
  '--sjs-article-font-default-textCase': 'none',

  '--sjs-header-backcolor': 'var(--sjs-primary-backcolor)',
} satisfies Record<string, string>;

const createMd3SurveyTheme = (mode: Md3Mode, r: Md3Resolver): ITheme => {
  const isLight = mode === 'light';

  return {
    themeName: 'md3',
    colorPalette: mode,
    isPanelless: true,
    cssVariables: {
      ...commonCssVariables,

      '--sjs-general-backcolor': isLight
        ? r.color('surface-container-lowest', mode, '#ffffff')
        : r.color('surface-container-low', mode, '#1d1b20'),
      '--sjs-general-backcolor-dark': r.color(
        'surface-container',
        mode,
        isLight ? '#f3edf7' : '#211f26',
      ),
      '--sjs-general-backcolor-dim': r.color(
        'background',
        mode,
        isLight ? '#fffbfe' : '#141218',
      ),
      '--sjs-general-backcolor-dim-light': r.color(
        'surface-container-low',
        mode,
        isLight ? '#f7f2fa' : '#1d1b20',
      ),
      '--sjs-general-backcolor-dim-dark': r.color(
        'surface-container-high',
        mode,
        isLight ? '#ece6f0' : '#2b2930',
      ),

      '--sjs-general-forecolor': r.color(
        'on-surface',
        mode,
        isLight ? '#1d1b20' : '#e6e0e9',
      ),
      '--sjs-general-forecolor-light': r.color(
        'on-surface-variant',
        mode,
        isLight ? '#49454f' : '#cac4d0',
      ),
      '--sjs-general-dim-forecolor': r.color(
        'on-surface',
        mode,
        isLight ? '#1d1b20' : '#e6e0e9',
      ),
      '--sjs-general-dim-forecolor-light': r.color(
        'on-surface-variant',
        mode,
        isLight ? '#49454f' : '#cac4d0',
      ),

      '--sjs-primary-backcolor': r.color(
        'primary',
        mode,
        isLight ? '#6750a4' : '#d0bcff',
      ),
      '--sjs-primary-backcolor-dark': r.color(
        'primary',
        mode,
        isLight ? '#6750a4' : '#d0bcff',
      ),
      '--sjs-primary-backcolor-light': r.rgba(
        'primary',
        mode,
        isLight ? '103, 80, 164' : '208, 188, 255',
        0.12,
      ),
      '--sjs-primary-forecolor': r.color(
        'on-primary',
        mode,
        isLight ? '#ffffff' : '#381e72',
      ),
      '--sjs-primary-forecolor-light': r.rgba(
        'on-primary',
        mode,
        isLight ? '255, 255, 255' : '56, 30, 114',
        0.38,
      ),

      '--sjs-secondary-backcolor': r.color(
        'secondary',
        mode,
        isLight ? '#625b71' : '#ccc2dc',
      ),
      '--sjs-secondary-backcolor-light': r.mix(
        'secondary',
        mode,
        isLight ? '#625b71' : '#ccc2dc',
        12,
      ),
      '--sjs-secondary-backcolor-semi-light': r.mix(
        'secondary',
        mode,
        isLight ? '#625b71' : '#ccc2dc',
        24,
      ),
      '--sjs-secondary-forecolor': r.color(
        'on-secondary',
        mode,
        isLight ? '#ffffff' : '#332d41',
      ),
      '--sjs-secondary-forecolor-light': r.mix(
        'on-secondary',
        mode,
        isLight ? '#ffffff' : '#332d41',
        38,
      ),

      '--sjs-border-light': r.color(
        'outline-variant',
        mode,
        isLight ? '#cac4d0' : '#49454f',
      ),
      '--sjs-border-default': r.color(
        'outline',
        mode,
        isLight ? '#79747e' : '#938f99',
      ),
      '--sjs-border-inside': r.color(
        'outline-variant',
        mode,
        isLight ? '#cac4d0' : '#49454f',
      ),

      '--sjs-shadow-small': surfaceShadow(r, mode, isLight ? 0.18 : 0.32),
      '--sjs-shadow-small-reset': '0px 0px 0px 0px transparent',
      '--sjs-shadow-medium': `0px 1px 2px 0px ${r.rgba(
        'shadow',
        mode,
        '0, 0, 0',
        isLight ? 0.2 : 0.35,
      )}, 0px 2px 6px 2px ${r.rgba('shadow', mode, '0, 0, 0', isLight ? 0.12 : 0.25)}`,
      '--sjs-shadow-large': `0px 4px 8px 3px ${r.rgba(
        'shadow',
        mode,
        '0, 0, 0',
        isLight ? 0.16 : 0.32,
      )}, 0px 1px 3px 0px ${r.rgba('shadow', mode, '0, 0, 0', isLight ? 0.22 : 0.4)}`,
      '--sjs-shadow-inner': `inset 0px 0px 0px 1px ${r.color('outline', mode, isLight ? '#79747e' : '#938f99')}`,
      '--sjs-shadow-inner-reset': 'inset 0px 0px 0px 0px transparent',

      '--sjs-special-red': r.color(
        'error',
        mode,
        isLight ? '#ba1a1a' : '#ffb4ab',
      ),
      '--sjs-special-red-light': r.rgba(
        'error',
        mode,
        isLight ? '186, 26, 26' : '255, 180, 171',
        0.12,
      ),
      '--sjs-special-red-forecolor': r.color(
        'on-error',
        mode,
        isLight ? '#ffffff' : '#690005',
      ),

      '--sjs-special-green': r.color(
        'positive',
        mode,
        isLight ? '#386a20' : '#9cd67d',
      ),
      '--sjs-special-green-light': r.mix(
        'positive',
        mode,
        isLight ? '#386a20' : '#9cd67d',
        12,
      ),
      '--sjs-special-green-forecolor': r.color(
        'on-positive',
        mode,
        isLight ? '#ffffff' : '#0c3900',
      ),

      '--sjs-special-blue': r.color(
        'info',
        mode,
        isLight ? '#00677e' : '#7bd1ee',
      ),
      '--sjs-special-blue-light': r.mix(
        'info',
        mode,
        isLight ? '#00677e' : '#7bd1ee',
        12,
      ),
      '--sjs-special-blue-forecolor': r.color(
        'on-info',
        mode,
        isLight ? '#ffffff' : '#003543',
      ),

      '--sjs-special-yellow': r.color(
        'warning',
        mode,
        isLight ? '#705d00' : '#e5c54f',
      ),
      '--sjs-special-yellow-light': r.mix(
        'warning',
        mode,
        isLight ? '#705d00' : '#e5c54f',
        16,
      ),
      '--sjs-special-yellow-forecolor': r.color(
        'on-warning',
        mode,
        isLight ? '#ffffff' : '#3a3000',
      ),
    },
  };
};

/**
 * Live MD3 survey themes built on `var(--md3-*)` references. Use these to
 * render published surveys so they track the app's MD3 palette at runtime.
 */
export const md3SurveyThemes: CThemes = {
  light: createMd3SurveyTheme('light', varResolver),
  dark: createMd3SurveyTheme('dark', varResolver),
};

/**
 * A frozen, resolve-on-load snapshot of the MD3 themes with every color baked
 * into a literal value. Feed this to the SurveyJS creator/theme editor, whose
 * color pickers cannot parse `var()` / `color-mix()` expressions.
 *
 * Must be called in the browser after the MD3 stylesheet is applied.
 */
export const createStaticMd3SurveyThemes = (): CThemes => {
  const r = createStaticResolver();
  return {
    light: createMd3SurveyTheme('light', r),
    dark: createMd3SurveyTheme('dark', r),
  };
};
