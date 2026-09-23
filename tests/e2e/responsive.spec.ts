import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const WIDTHS = [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920];
const PUBLIC_PAGES = ["/", "/menu", "/cart", "/checkout"];
const ADMIN_PAGES = ["/admin", "/admin/menu", "/admin/homepage", "/admin/ordering", "/admin/contact"];

for (const width of WIDTHS) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of PUBLIC_PAGES) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
      expect(scrollWidth, `${path} overflows at ${width}px`).toBeLessThanOrEqual(innerWidth);
    }
  });
}

test("admin pages fit on small phones", async ({ page }) => {
  await login(page);
  for (const width of [360, 768]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ADMIN_PAGES) {
      await page.goto(path);
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
      expect(scrollWidth, `${path} overflows at ${width}px`).toBeLessThanOrEqual(innerWidth);
    }
  }
});

test("primary ordering controls are thumb-sized on phones", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  for (const locator of [page.locator("#top").getByRole("link", { name: /order now/i }), page.locator('[data-cart-target="primary"]')]) {
    const box = await locator.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
  await page.goto("/menu");
  const add = page.getByRole("button", { name: /add .* to cart|customise and add/i }).first();
  expect((await add.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(40);
});
