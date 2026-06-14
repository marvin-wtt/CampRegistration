import type { ICreatorTheme } from 'survey-creator-core';

type Md3Mode = 'light' | 'dark';

export interface CCreatorThemes {
  light: ICreatorTheme;
  dark: ICreatorTheme;
}

const md3 = (token: string, mode: Md3Mode, fallback: string) => {
  return `var(--md3-${token}--${mode}, var(--md3-${token}, ${fallback}))`;
};

const md3Mix = (
  token: string,
  mode: Md3Mode,
  fallback: string,
  amount: number,
) => {
  return `color-mix(in srgb, ${md3(token, mode, fallback)} ${amount}%, transparent)`;
};

const createMd3CreatorTheme = (mode: Md3Mode): ICreatorTheme => {
  const isLight = mode === 'light';

  return {
    themeName: `md3-creator-${mode}`,
    cssVariables: {
      /**
       * Base sizing
       */
      '--ctr-size-unit': '8px',
      '--ctr-spacing-unit': '8px',
      '--ctr-corner-radius-unit': '16px',
      '--ctr-stroke-unit': '1px',
      '--ctr-font-unit': '8px',
      '--ctr-line-height-unit': '8px',
      '--ctr-font-family':
        'Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

      '--lbr-size-unit': '8px',
      '--lbr-spacing-unit': '8px',
      '--lbr-corner-radius-unit': '16px',
      '--lbr-stroke-unit': '1px',
      '--lbr-font-unit': '8px',
      '--lbr-line-height-unit': '8px',
      '--lbr-font-family':
        'Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

      '--sjs-base-unit': '8px',
      '--sjs-corner-radius': '16px',
      '--sjs-font-family':
        'Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

      /**
       * Creator layers
       *
       * Layer 1: root app shell / main editor chrome
       * Layer 2: sidebars, property grid, toolbox
       * Layer 3: nested cards, selected/hovered tool items, popups
       */
      '--sjs-layer-1-background-500': md3(
        'background',
        mode,
        isLight ? '#fffbfe' : '#141218',
      ),
      '--sjs-layer-1-background-400': md3(
        'surface-container-low',
        mode,
        isLight ? '#f7f2fa' : '#1d1b20',
      ),
      '--sjs-layer-1-foreground-100': md3(
        'on-surface',
        mode,
        isLight ? '#1d1b20' : '#e6e0e9',
      ),
      '--sjs-layer-1-foreground-50': md3Mix(
        'on-surface',
        mode,
        isLight ? '#1d1b20' : '#e6e0e9',
        55,
      ),

      '--sjs-layer-2-background-500': md3(
        'surface',
        mode,
        isLight ? '#fffbfe' : '#141218',
      ),
      '--sjs-layer-2-background-400': md3(
        'surface-container',
        mode,
        isLight ? '#f3edf7' : '#211f26',
      ),
      '--sjs-layer-2-foreground-100': md3(
        'on-surface',
        mode,
        isLight ? '#1d1b20' : '#e6e0e9',
      ),
      '--sjs-layer-2-foreground-75': md3(
        'on-surface-variant',
        mode,
        isLight ? '#49454f' : '#cac4d0',
      ),
      '--sjs-layer-2-foreground-50': md3Mix(
        'on-surface-variant',
        mode,
        isLight ? '#49454f' : '#cac4d0',
        55,
      ),

      '--sjs-layer-3-background-500': md3(
        'surface-container-high',
        mode,
        isLight ? '#ece6f0' : '#2b2930',
      ),
      '--sjs-layer-3-background-400': md3(
        'surface-container-highest',
        mode,
        isLight ? '#e6e0e9' : '#36343b',
      ),
      '--sjs-layer-3-foreground-100': md3(
        'on-surface',
        mode,
        isLight ? '#1d1b20' : '#e6e0e9',
      ),
      '--sjs-layer-3-foreground-75': md3(
        'on-surface-variant',
        mode,
        isLight ? '#49454f' : '#cac4d0',
      ),
      '--sjs-layer-3-foreground-50': md3Mix(
        'on-surface-variant',
        mode,
        isLight ? '#49454f' : '#cac4d0',
        55,
      ),

      /**
       * Primary / secondary
       */
      '--sjs-primary-background-500': md3(
        'primary',
        mode,
        isLight ? '#6750a4' : '#d0bcff',
      ),
      '--sjs-primary-background-400': md3(
        'primary-container',
        mode,
        isLight ? '#eaddff' : '#4f378b',
      ),
      '--sjs-primary-background-10': md3Mix(
        'primary',
        mode,
        isLight ? '#6750a4' : '#d0bcff',
        12,
      ),
      '--sjs-primary-foreground-100': md3(
        'on-primary',
        mode,
        isLight ? '#ffffff' : '#381e72',
      ),
      '--sjs-primary-foreground-25': md3Mix(
        'on-primary',
        mode,
        isLight ? '#ffffff' : '#381e72',
        38,
      ),

      '--sjs-secondary-background-500': md3(
        'secondary',
        mode,
        isLight ? '#625b71' : '#ccc2dc',
      ),
      '--sjs-secondary-background-400': md3(
        'secondary-container',
        mode,
        isLight ? '#e8def8' : '#4a4458',
      ),
      '--sjs-secondary-background-25': md3Mix(
        'secondary',
        mode,
        isLight ? '#625b71' : '#ccc2dc',
        24,
      ),
      '--sjs-secondary-background-10': md3Mix(
        'secondary',
        mode,
        isLight ? '#625b71' : '#ccc2dc',
        12,
      ),
      '--sjs-secondary-foreground-100': md3(
        'on-secondary',
        mode,
        isLight ? '#ffffff' : '#332d41',
      ),
      '--sjs-secondary-forecolor-25': md3Mix(
        'on-secondary',
        mode,
        isLight ? '#ffffff' : '#332d41',
        38,
      ),

      /**
       * Borders
       */
      '--sjs-border-25': md3Mix(
        'outline',
        mode,
        isLight ? '#79747e' : '#938f99',
        isLight ? 55 : 65,
      ),
      '--sjs-border-10': md3Mix(
        'outline-variant',
        mode,
        isLight ? '#cac4d0' : '#49454f',
        isLight ? 70 : 80,
      ),
      '--sjs-border-25-overlay': md3Mix(
        'outline',
        mode,
        isLight ? '#79747e' : '#938f99',
        32,
      ),

      /**
       * Semantic colors
       */
      '--sjs-semantic-red-background-500': md3(
        'error',
        mode,
        isLight ? '#ba1a1a' : '#ffb4ab',
      ),
      '--sjs-semantic-red-background-10': md3Mix(
        'error',
        mode,
        isLight ? '#ba1a1a' : '#ffb4ab',
        12,
      ),
      '--sjs-semantic-red-foreground-100': md3(
        'on-error',
        mode,
        isLight ? '#ffffff' : '#690005',
      ),

      '--sjs-semantic-green-background-500': md3(
        'positive',
        mode,
        isLight ? '#386a20' : '#9cd67d',
      ),
      '--sjs-semantic-green-background-10': md3Mix(
        'positive',
        mode,
        isLight ? '#386a20' : '#9cd67d',
        12,
      ),
      '--sjs-semantic-green-foreground-100': md3(
        'on-positive',
        mode,
        isLight ? '#ffffff' : '#0c3900',
      ),

      '--sjs-semantic-blue-background-500': md3(
        'info',
        mode,
        isLight ? '#00677e' : '#7bd1ee',
      ),
      '--sjs-semantic-blue-background-10': md3Mix(
        'info',
        mode,
        isLight ? '#00677e' : '#7bd1ee',
        12,
      ),
      '--sjs-semantic-blue-foreground-100': md3(
        'on-info',
        mode,
        isLight ? '#ffffff' : '#003543',
      ),

      '--sjs-semantic-yellow-background-500': md3(
        'warning',
        mode,
        isLight ? '#705d00' : '#e5c54f',
      ),
      '--sjs-semantic-yellow-background-10': md3Mix(
        'warning',
        mode,
        isLight ? '#705d00' : '#e5c54f',
        16,
      ),
      '--sjs-semantic-yellow-foreground-100': md3(
        'on-warning',
        mode,
        isLight ? '#ffffff' : '#3a3000',
      ),

      '--sjs-semantic-white-background-500': isLight
        ? '#ffffff'
        : md3('surface-container-highest', mode, '#36343b'),

      /**
       * Creator special effects
       */
      '--sjs-special-haze': md3Mix(
        'primary',
        mode,
        isLight ? '#6750a4' : '#d0bcff',
        20,
      ),
      '--sjs-special-glow': md3Mix(
        'primary',
        mode,
        isLight ? '#6750a4' : '#d0bcff',
        16,
      ),
      '--sjs-special-shadow': isLight
        ? 'rgba(0, 0, 0, 0.18)'
        : 'rgba(0, 0, 0, 0.45)',
      '--sjs-special-background': md3(
        'surface-container-low',
        mode,
        isLight ? '#f7f2fa' : '#1d1b20',
      ),

      /**
       * Code editor / JSON editor colors
       */
      '--sjs-code-gray-700': md3(
        'on-surface',
        mode,
        isLight ? '#1d1b20' : '#e6e0e9',
      ),
      '--sjs-code-gray-500': md3(
        'on-surface-variant',
        mode,
        isLight ? '#49454f' : '#cac4d0',
      ),
      '--sjs-code-gray-300': md3(
        'outline-variant',
        mode,
        isLight ? '#cac4d0' : '#49454f',
      ),
      '--sjs-code-blue-500': md3(
        'primary',
        mode,
        isLight ? '#6750a4' : '#d0bcff',
      ),
      '--sjs-code-green-500': md3(
        'tertiary',
        mode,
        isLight ? '#7d5260' : '#efb8c8',
      ),
      '--sjs-code-red-500': md3('error', mode, isLight ? '#ba1a1a' : '#ffb4ab'),
      '--sjs-code-purple-500': md3(
        'secondary',
        mode,
        isLight ? '#625b71' : '#ccc2dc',
      ),
      '--sjs-code-yellow-500': md3(
        'warning',
        mode,
        isLight ? '#705d00' : '#e5c54f',
      ),

      '--sjs-general-backcolor': md3(
        'surface-container-lowest',
        mode,
        isLight ? '#ffffff' : '#1d1b20',
      ),
      '--sjs-general-backcolor-dark': md3(
        'surface-container-highest',
        mode,
        isLight ? '#e6e0e9' : '#36343b',
      ),
      '--sjs-general-backcolor-dim': md3(
        'background',
        mode,
        isLight ? '#fffbfe' : '#141218',
      ),
      '--sjs-general-backcolor-dim-light': md3(
        'surface-container-high',
        mode,
        isLight ? '#ece6f0' : '#2b2930',
      ),
      '--sjs-general-backcolor-dim-dark': md3(
        'surface-container-highest',
        mode,
        isLight ? '#e6e0e9' : '#36343b',
      ),

      '--sjs-general-forecolor': md3(
        'on-surface',
        mode,
        isLight ? '#1d1b20' : '#e6e0e9',
      ),
      '--sjs-general-forecolor-light': md3(
        'on-surface-variant',
        mode,
        isLight ? '#49454f' : '#cac4d0',
      ),

      '--sjs-border-default': md3(
        'outline',
        mode,
        isLight ? '#79747e' : '#938f99',
      ),
      '--sjs-border-light': md3(
        'outline-variant',
        mode,
        isLight ? '#cac4d0' : '#49454f',
      ),
      '--sjs-border-inside': md3Mix(
        'outline',
        mode,
        isLight ? '#79747e' : '#938f99',
        isLight ? 65 : 75,
      ),

      '--sjs-shadow-inner': `inset 0 0 0 1px ${md3(
        'outline',
        mode,
        isLight ? '#79747e' : '#938f99',
      )}`,
      '--sjs-shadow-inner-reset': 'inset 0 0 0 0 transparent',

      '--sjs-primary-backcolor': md3(
        'primary',
        mode,
        isLight ? '#6750a4' : '#d0bcff',
      ),
      '--sjs-primary-forecolor': md3(
        'on-primary',
        mode,
        isLight ? '#ffffff' : '#381e72',
      ),
      '--sjs-primary-backcolor-light': md3Mix(
        'primary',
        mode,
        isLight ? '#6750a4' : '#d0bcff',
        12,
      ),
    },
  };
};

export const md3CreatorThemes: CCreatorThemes = {
  light: createMd3CreatorTheme('light'),
  dark: createMd3CreatorTheme('dark'),
};
