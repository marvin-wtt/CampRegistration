import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  plugins: [tsconfigPaths()],
  test: {
    include: [
      'src/**/*.unit.{test,spec}.{js,mjs,cjs,ts,mts}',
      'tests/unit/**/*.test.ts',
    ],
    coverage: {
      enabled: true,
      include: ['src/*'],
      provider: 'v8',
      reporter: ['html', 'text', 'json', 'clover'],
      reportsDirectory: './tests/integration/coverage',
    },
  },
});
