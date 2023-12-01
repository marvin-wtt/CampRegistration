import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    threads: false,
    setupFiles: ["tests/utils/setup.ts"],
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["html", "text", "json", "clover"],
      reportsDirectory: "./tests/integration/coverage",
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
