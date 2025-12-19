import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ['./tsconfig.test.json'] })],
  test: {
    include: ['tests/integration/core/**/*.test.ts'],
    maxWorkers: 1,
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
