import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./scripts/env-setup.ts"],
    exclude: [...configDefaults.exclude, "**/e2e/**"],
  },
});
