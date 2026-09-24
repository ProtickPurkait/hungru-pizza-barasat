import { expect, test } from "@playwright/test";

test("design preview: full order flow ends on a sample confirmation, nothing saved", async ({ page }) => {
  const serverErrors: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 500) serverErrors.push(`${r.status()} ${r.url()}`);
  });

  await page.goto("/");
  await expect(page.getByRole("note").filter({ hasText: /design preview/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/pizza/i);

  await page.goto("/menu");
  await page.getByRole("button", { name: "Customise and add Farmhouse" }).first().click();
  const sheet = page.locator("dialog[open]");
  await sheet.getByText("Large", { exact: true }).click();
  await expect(sheet.getByRole("button", { name: /add to cart/i })).toContainText("₹559");
  await sheet.getByRole("button", { name: /add to cart/i }).click();
  await expect(sheet).toBeHidden();
  await page.getByRole("button", { name: "Add Cola to cart" }).click();

  await page.goto("/cart");
  await page.getByRole("link", { name: /proceed to order/i }).click();
  await page.waitForURL("**/checkout");
  await expect(page.getByText(/your order won.t be sent anywhere/i)).toBeVisible();

  await page.getByLabel("Your name").fill("Preview Visitor");
  await page.getByLabel("Mobile number").fill("98765 43210");
  await page.getByLabel("Delivery address").fill("1 Sample Street, Sample Area");
  await page.getByRole("button", { name: /place order/i }).click();

  await page.waitForURL("**/order/demo?o=*");
  await expect(page.getByText(/this order was not sent to the restaurant/i)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/order received/i);
  await expect(page.getByText("Order DEMO")).toBeVisible();
  await expect(page.getByText("₹619").first()).toBeVisible();
  await expect(page.getByText("1 × Farmhouse")).toBeVisible();

  expect(serverErrors).toEqual([]);
});

test("design preview: tampered or unknown order links show not found", async ({ page }) => {
  expect((await page.goto("/order/demo?o=not-valid"))?.status()).toBe(404);
  expect((await page.goto("/order/abcdefghijklmnopqrstuvwxyz"))?.status()).toBe(404);
});

test("design preview: admin explains it's unavailable and search engines are kept out", async ({ page, request }) => {
  await page.goto("/admin/menu");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Admin not available" })).toBeVisible();
  await expect(page.getByLabel("Password")).toHaveCount(0);

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \/\s*$/m);
  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  expect((await request.get("/api/orders/abcdefghijklmnopqrstuvwxyz")).status()).toBe(503);
});
