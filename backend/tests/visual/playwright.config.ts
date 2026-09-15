import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

// Rendering an email needs the backend's config (`#config/index`) to be
// valid, same as any other backend entrypoint — this test never starts the
// app or hits a database, it only renders templates.
process.env.NODE_ENV ??= 'test';
loadEnv({ path: path.join(backendRoot, '.env.test') });

export default defineConfig({
  testDir: '.',
  snapshotDir: './__screenshots__',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    viewport: { width: 640, height: 800 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
