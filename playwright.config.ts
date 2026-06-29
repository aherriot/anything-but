import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E config. The dev server is started for us and torn down afterwards.
 *
 * Placeholder env vars let the app boot without real credentials: the public
 * pages render, and anything that needs a secret simply fails its network call
 * (which the deterministic specs don't depend on). A full collaborative-voting
 * E2E needs a seeded InstantDB test app — see e2e/voting.spec.ts.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_INSTANT_APP_ID:
        process.env.NEXT_PUBLIC_INSTANT_APP_ID ?? "e2e-placeholder",
    },
  },
});
