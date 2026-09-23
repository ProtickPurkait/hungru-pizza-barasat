import { chromium } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const shot = async (ctxOpts, url, out, opts = {}) => {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  if (opts.login) {
    await page.goto("http://localhost:3000/admin/login");
    await page.getByLabel("Email").fill("owner@hungru.test");
    await page.getByLabel("Password").fill("dev-password-123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("http://localhost:3000/admin");
  }
  await page.goto("http://localhost:3000" + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  if (opts.action) await opts.action(page);
  await page.screenshot({ path: out, fullPage: Boolean(opts.full) });
  await ctx.close();
};
await shot({ viewport: { width: 320, height: 640 }, deviceScaleFactor: 2 }, "/", "/tmp/claude-0/shots/hero-320.png");
await shot({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }, "/admin", "/tmp/claude-0/shots/admin-m-dash.png", {
  login: true,
  full: true,
});
await shot({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }, "/admin/menu", "/tmp/claude-0/shots/admin-m-menu.png", {
  login: true,
});
await shot({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }, "/admin/ordering", "/tmp/claude-0/shots/admin-m-ordering.png", {
  login: true,
  full: true,
});
await shot(
  { viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 },
  "/menu?item=paneer-tikka",
  "/tmp/claude-0/shots/sheet-desktop.png",
);
await browser.close();
