import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/** The no-database design preview (DEMO_MODE=true), as deployed on Netlify. The database URL points nowhere on purpose. */
const PORT = Number(process.env.E2E_DEMO_PORT ?? 3300);
const baseURL = `http://localhost:${PORT}`;
const localChromium = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /demo\.spec\.ts/,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    ...devices["Pixel 7"],
    browserName: "chromium",
    baseURL,
    trace: "retain-on-failure",
    launchOptions: existsSync(localChromium) ? { executablePath: localChromium } : {},
  },
  webServer: {
    command: `node -e "require('fs').rmSync('.next/cache',{recursive:true,force:true})" && npx next build && npx next start -p ${PORT}`,
    url: baseURL,
    timeout: 300_000,
    reuseExistingServer: false,
    env: { DEMO_MODE: "true", DATABASE_URL: "postgres://nobody:nothing@127.0.0.1:1/none", NEXT_PUBLIC_SITE_URL: baseURL },
  },
});
