import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["tests/integration/**/*.test.ts"],
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    setupFiles: ["tests/utils/setup.ts"],
    coverage: {
      enabled: true,
      include: ["src/*"],
      provider: "v8",
      reporter: ["html", "text", "json", "clover"],
      reportsDirectory: "./tests/integration/coverage",
    },
  },
});
