import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';
import { BaseTheme } from 'survey-core';

const here = dirname(fileURLToPath(import.meta.url));

function fromNodeModules(relativePath: string): string {
  let directory = here;

  for (;;) {
    const candidate = join(directory, 'node_modules', relativePath);
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = dirname(directory);
    if (parent === directory) {
      throw new Error(`Cannot resolve ${relativePath}`);
    }

    directory = parent;
  }
}

/** The adapter's declarations, compiled the same way the app bundles them. */
const adapter = ((): Record<string, string> => {
  const css = sass
    .compile(join(here, 'md3-adapter.scss'))
    .css.replace(/\/\*[\s\S]*?\*\//g, '');
  // The token rule only; the file also carries scoped component rules.
  const start = css.indexOf('.sjs-theme-overrides {');
  const block = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));

  const declarations: Record<string, string> = {};
  for (const line of block.split(';')) {
    const match = /^\s*(--sjs2-[a-z0-9-]+)\s*:\s*([\s\S]+)$/.exec(line);
    if (match) {
      declarations[match[1]!] = match[2]!.replace(/\s+/g, ' ').trim();
    }
  }

  return declarations;
})();

describe('MD3 SurveyJS adapter', () => {
  it('only targets tokens the SurveyJS base theme defines', () => {
    const known = new Set(Object.keys(BaseTheme.cssVariables ?? {}));

    expect(Object.keys(adapter).filter((token) => !known.has(token))).toEqual(
      [],
    );
  });

  it('only references MD3 roles the app extension emits', () => {
    // Stands in for the `Md3Role` union the TypeScript token map used to carry:
    // a typo produces an unresolvable `var(--md3-typo)` that nothing else would
    // catch.
    const palette = readFileSync(
      fromNodeModules('@anoyomoose/q2-fresh-paint-md3e/dist/theme/base.scss'),
      'utf8',
    );
    const known = new Set(palette.match(/--md3-[a-z0-9-]+/g) ?? []);

    const referenced = new Set(
      Object.values(adapter).flatMap(
        (value) => value.match(/--md3-[a-z0-9-]+/g) ?? [],
      ),
    );

    expect([...referenced].filter((role) => !known.has(role))).toEqual([]);
  });

  it('maps every status role', () => {
    for (const status of ['note', 'positive', 'warning', 'alert']) {
      expect(adapter[`--sjs2-color-bg-${status}-primary`]).toBeDefined();
      expect(adapter[`--sjs2-color-fg-${status}-on-primary`]).toBeDefined();
      expect(adapter[`--sjs2-color-border-${status}-primary`]).toBeDefined();
    }
  });

  it('pins the static tokens to the light palette', () => {
    // These are contrast pairs that must stay put when the rest of the palette
    // flips, so they may never reference a colour-scheme-following alias.
    const staticTokens = Object.entries(adapter).filter(([token]) =>
      /--sjs2-color-(bg|fg|border)-static-/.test(token),
    );

    expect(staticTokens.length).toBeGreaterThan(0);
    for (const [token, value] of staticTokens) {
      for (const role of value.match(/--md3-[a-z0-9-]+/g) ?? []) {
        expect(role, token).toMatch(/--light$/);
      }
    }
  });
});
