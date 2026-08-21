import type { Prisma } from '#generated/prisma/client.js';
import { patchLegacyCSSVariables } from 'survey-core';

/**
 * Converts stored SurveyJS themes from the deprecated `--sjs-*` CSS variables
 * to the `--sjs2-*` design tokens introduced in SurveyJS v3.
 *
 * v3 still ships a compatibility shim, but it is lossy — `--sjs-secondary-*`,
 * `--sjs-general-dim-forecolor*` and `--sjs-font-size` have no target at all —
 * and it is explicitly deprecated. Converting once here means the stored themes
 * stop depending on it. `patchLegacyCSSVariables` is survey-core's own shim, so
 * the result is exactly what the runtime was producing.
 *
 * Also promotes a dark-only theme to `light`: the MD3 adapter now supplies the
 * colour scheme, so the app reads a single saved theme, and a camp that only
 * ever saved a dark palette would otherwise lose its customisation.
 */
export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const camps = await tx.camp.findMany({ select: { id: true, themes: true } });

  for (const camp of camps) {
    const themes = camp.themes;
    if (!themes || typeof themes !== 'object' || Array.isArray(themes)) {
      continue;
    }

    const entries = themes as Record<string, unknown>;
    let modified = false;

    if (!isTheme(entries.light) && isTheme(entries.dark)) {
      entries.light = structuredClone(entries.dark);
      modified = true;
    }

    for (const theme of Object.values(entries)) {
      if (!isTheme(theme)) {
        continue;
      }

      const before = JSON.stringify(theme.cssVariables);
      patchLegacyCSSVariables(theme.cssVariables, theme.isPanelless);
      ensureHeaderForeground(theme.cssVariables);
      if (JSON.stringify(theme.cssVariables) !== before) {
        modified = true;
      }
    }

    if (modified) {
      await tx.camp.update({
        where: { id: camp.id },
        data: { themes: entries },
      });
    }
  }
}

interface LegacyTheme {
  cssVariables: Record<string, string>;
  isPanelless?: boolean;
}

function isTheme(value: unknown): value is LegacyTheme {
  return (
    typeof value === 'object' &&
    value !== null &&
    'cssVariables' in value &&
    typeof (value as LegacyTheme).cssVariables === 'object' &&
    (value as LegacyTheme).cssVariables !== null
  );
}

const HEADER_BG = '--sjs2-color-component-survey-header-default-bg';
const HEADER_TITLE = '--sjs2-color-component-survey-header-default-title';
const HEADER_DESCRIPTION =
  '--sjs2-color-component-survey-header-default-description';

const ON_LIGHT = '#1c1b1f';
const ON_DARK = '#ffffff';

/**
 * Gives a theme's survey header a foreground that contrasts with its own
 * background.
 *
 * A theme using `headerView: "advanced"` pins the header background to a solid
 * brand colour but leaves the title and description on the global foreground,
 * which the frontend's MD3 adapter resolves live from `--md3-*`. A frozen
 * background paired with a colour-scheme-following foreground goes dark-on-dark
 * as soon as the viewer switches theme — the header title measured 1.01:1 that
 * way.
 *
 * Deliberately duplicated from the frontend's `lib/surveyJs/theme` rather than
 * imported: a migration is a record of what ran at one point in time and must
 * keep producing that result even after the app's copy moves on.
 *
 * Mutates `cssVariables` in place and only fills gaps, so an explicit choice in
 * the Theme Editor always wins. Backgrounds that are not literal colours
 * (`var(...)`, gradients) are left alone: those follow the adapter, so the pair
 * is already consistent.
 */
function ensureHeaderForeground(cssVariables: Record<string, string>): void {
  const background = cssVariables[HEADER_BG];
  if (!background) {
    return;
  }

  const rgb = parseColor(background);
  if (!rgb) {
    return;
  }

  const foreground = relativeLuminance(rgb) > 0.45 ? ON_LIGHT : ON_DARK;
  cssVariables[HEADER_TITLE] ??= foreground;
  cssVariables[HEADER_DESCRIPTION] ??= foreground;
}

function parseColor(input: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (hex) {
    let h = hex[1];
    if (h.length === 3) {
      h = h
        .split('')
        .map((c) => c + c)
        .join('');
    }
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  const rgb = /^rgba?\(([^)]+)\)$/i.exec(input.trim());
  if (rgb) {
    const parts = rgb[1]
      .split(/[,\s/]+/)
      .filter(Boolean)
      .map(Number);
    if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) {
      return null;
    }
    return [parts[0], parts[1], parts[2]];
  }

  return null;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number) => {
    const n = value / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
