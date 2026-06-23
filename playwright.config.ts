import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3022",
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3022",
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
