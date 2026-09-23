import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3200);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const databaseUrl = process.env.E2E_DATABASE_URL ?? "postgres://hungru:hungru_dev@localhost:5432/hungru_test";
const localChromium = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    launchOptions: existsSync(localChromium) ? { executablePath: localChromium } : {},
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], browserName: "chromium" }, testMatch: /funnel|modes|a11y/ },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } }, testMatch: /admin|responsive/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // Fresh database + no cached data from earlier runs, then a production build.
        command: `npx tsx scripts/e2e-prepare.ts && node -e "require('fs').rmSync('.next/cache',{recursive:true,force:true})" && npx next build && npx next start -p ${PORT}`,
        url: baseURL,
        timeout: 300_000,
        reuseExistingServer: false,
        env: {
          DATABASE_URL: databaseUrl,
          NEXT_PUBLIC_SITE_URL: baseURL,
          MEDIA_STORAGE: "db",
        },
      },
});
