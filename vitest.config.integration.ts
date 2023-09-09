import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    threads: false,
    setupFiles: ["tests/utils/setup.ts"],
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
