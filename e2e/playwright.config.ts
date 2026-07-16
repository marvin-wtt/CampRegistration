import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

// The backend only ever loads `backend/.env` itself (never `.env.e2e`) — it
// relies on whoever launches it to have already put the e2e values into
// process.env.
loadEnv({ path: path.join(repoRoot, "backend", ".env.e2e"), quiet: true });

export default defineConfig({
  testDir: "./tests",
  // Every test truncates and reseeds a shared database, so specs must not
  // run concurrently against it
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  globalSetup: "./support/globalSetup.ts",

  webServer: {
    command: "npm run production",
    cwd: repoRoot,
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
  },

  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    testIdAttribute: "data-test",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] },
    },
  ],
});
