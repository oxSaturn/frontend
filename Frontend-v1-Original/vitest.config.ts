import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./scripts/env-setup.ts"],
    exclude: [...configDefaults.exclude, "**/e2e/**"],
  },
});
