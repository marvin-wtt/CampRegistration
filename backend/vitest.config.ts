import { defineConfig } from 'vitest/config';

/**
 * Combined runner used by CI (`npm run test`). It executes the unit and
 * integration suites as two Vitest projects in a single run, so their V8
 * coverage is collected together and merged into one report under
 * `tests/coverage`. Each suite keeps its own config (`vitest.config.unit.ts`
 * / `vitest.config.integration.ts`) for granular local runs via
 * `test:unit` / `test:int`.
 */
export default defineConfig({
  test: {
    projects: ['./vitest.config.unit.ts', './vitest.config.integration.ts'],
    coverage: {
      enabled: true,
      include: ['src/*'],
      exclude: ['src/i18n/*', 'entry.js', 'index.ts'],
      provider: 'v8',
      reporter: ['html', 'text', 'json', 'json-summary', 'clover'],
      reportsDirectory: './tests/coverage',
      reportOnFailure: true,
    },
  },
});
