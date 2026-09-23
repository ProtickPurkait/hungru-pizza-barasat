import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("mobile visitor goes from homepage to a placed order", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/pizza/i);

  // Sticky bottom CTA is visible on phones before anything is in the cart.
  const bar = page.locator('[data-cart-target="primary"]');
  await expect(bar).toContainText(/order now/i);

  await page
    .locator("#top")
    .getByRole("link", { name: /order now/i })
    .click();
  await page.waitForURL("**/menu");

  // Customisable pizza → sheet with live price.
  await page.getByRole("button", { name: "Customise and add Farmhouse" }).first().click();
  const sheet = page.locator("dialog[open]");
  await expect(sheet.getByRole("heading", { name: "Farmhouse" })).toBeVisible();
  await expect(page).toHaveURL(/item=farmhouse/);
  await sheet.getByText("Large", { exact: true }).click();
  await expect(sheet.getByRole("button", { name: /add to cart/i })).toContainText("₹559"); // 259 + 300
  await sheet.getByRole("button", { name: /add to cart/i }).click();
  await expect(sheet).toBeHidden();

  // Simple item adds instantly and turns into a stepper.
  await page.getByRole("button", { name: "Add Cola to cart" }).click();
  await expect(page.getByRole("group", { name: "Quantity for Cola" })).toBeVisible();

  await expect(bar).toContainText("2");
  await expect(bar).toContainText("₹619");
  await bar.click();
  await page.waitForURL("**/cart");
  await expect(page.getByText("Large · Classic hand-tossed")).toBeVisible();
  await expect(page.getByText("−₹40")).toBeVisible();

  await page.getByRole("link", { name: /proceed to order/i }).click();
  await page.waitForURL("**/checkout");

  // Validation
  await page.getByRole("button", { name: /place order/i }).click();
  await expect(page.getByText("Please enter your name")).toBeVisible();

  await page.getByLabel("Your name").fill("E2E Customer");
  await page.getByLabel("Mobile number").fill("98765 43210");
  await page.getByLabel("Delivery address").fill("12 Test Lane, near Test Park, Barasat");
  await page.getByRole("button", { name: /place order/i }).click();

  await page.waitForURL("**/order/**");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/order received/i);
  await expect(page.getByText(/Order HP-\d+/)).toBeVisible();
  await expect(page.getByText("₹619").first()).toBeVisible();
  await expect(page.getByText(/waiting for the restaurant/i)).toBeVisible();
});

test("back button closes the product sheet and deep links open it", async ({ page }) => {
  await page.goto("/menu?item=margherita");
  await expect(page.locator("dialog[open]").getByRole("heading", { name: "Margherita" })).toBeVisible();
  await page.goto("/menu");
  await page.getByRole("button", { name: "Customise and add Margherita" }).first().click();
  await expect(page.locator("dialog[open]")).toBeVisible();
  await page.goBack();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page).toHaveURL(/\/menu$/);
});

test("veg filter and search narrow the menu", async ({ page }) => {
  await page.goto("/menu");
  await page.getByRole("switch", { name: /veg only/i }).click();
  await expect(page.getByRole("button", { name: "Pepperoni", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Margherita", exact: true }).first()).toBeVisible();
  await page.getByRole("searchbox", { name: /search the menu/i }).fill("zzz-no-match");
  await expect(page.getByText("No matches")).toBeVisible();
});
