import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests drive the real stack: the Python API and the Next.js app,
 * both started by Playwright on dedicated ports so a `npm run dev` already
 * running on 3000/8000 is left alone.
 *
 * The API gets its own database file, seeded from scratch on first boot, so a
 * test that places an order cannot eat into the stock you are browsing in dev.
 */

const API_PORT = 8111;
const WEB_PORT = 3111;
const API_URL = `http://127.0.0.1:${API_PORT}`;

const BACKEND = path.resolve(__dirname, "..", "backend");

// Resolved absolutely and with platform separators: a relative, forward-slash
// path is not a runnable command under cmd.exe, which is what Playwright uses
// to spawn webServer on Windows.
const PY = path.join(
  BACKEND,
  ".venv",
  ...(process.platform === "win32" ? ["Scripts", "python.exe"] : ["bin", "python"]),
);

export default defineConfig({
  testDir: "./e2e",
  // The suite shares one API database, so ordering matters less than isolation:
  // run files in parallel but keep each file serial.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 45_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: [
    {
      command: `"${PY}" -m uvicorn app.main:app --port ${API_PORT}`,
      cwd: BACKEND,
      url: `${API_URL}/api/health`,
      reuseExistingServer: !process.env.CI,
      // Seeding 859 products and 1,193 models takes a moment on a cold start.
      timeout: 120_000,
      env: {
        DATABASE_URL: "sqlite:///./e2e_revline.db",
        CORS_ORIGINS: `http://127.0.0.1:${WEB_PORT},http://localhost:${WEB_PORT}`,
        RATE_LIMIT_ENABLED: "false",
        ENVIRONMENT: "test",
      },
    },
    {
      // The dev server, not `build && start`, on purpose: this project lives
      // under OneDrive, and `next build` intermittently dies with
      // EINVAL readlink on .next/diagnostics when OneDrive turns a build
      // artefact into a cloud placeholder. Dev never writes that directory, so
      // the suite runs reliably here. `npm run build` is still checked
      // separately — see the Tests section of the README.
      command: `npm run dev -- --port ${WEB_PORT}`,
      url: `http://127.0.0.1:${WEB_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_API_URL: API_URL,
        API_URL_INTERNAL: API_URL,
      },
    },
  ],
});
