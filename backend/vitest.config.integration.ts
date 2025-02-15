import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  plugins: [tsconfigPaths()],
  test: {
    include: [
      'src/**/*.integration.{test,spec}.{js,mjs,cjs,ts,mts}',
      'tests/integration/**/*.test.ts',
    ],
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    setupFiles: ['tests/utils/setup.ts'],
    coverage: {
      enabled: true,
      include: ['src/*'],
      provider: 'v8',
      reporter: ['html', 'text', 'json', 'clover'],
    },
    restoreMocks: true,
  },
});
