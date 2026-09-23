import { expect, test } from "@playwright/test";
import { login, menuCard, openProduct, publish } from "./helpers";

test.describe.configure({ mode: "serial" });

test("admin area is protected", async ({ page, request }) => {
  await page.goto("/admin/menu");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fmenu/);

  await page.getByLabel("Email").fill("e2e-owner@hungru.test");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That email and password don't match.")).toBeVisible();

  const upload = await request.post("/api/admin/media", { multipart: { file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("x") } } });
  expect(upload.status()).toBe(401);
  const list = await request.get("/api/admin/media");
  expect(list.status()).toBe(401);
});

test("price changes stay in draft until published; preview shows them", async ({ page, browser }) => {
  await login(page);
  const visitor = await (await browser.newContext()).newPage();

  await visitor.goto("/menu");
  await expect(menuCard(visitor, "Margherita")).toContainText("₹199");

  await openProduct(page, "Margherita");
  await page.getByRole("textbox", { name: "Price", exact: true }).fill("249");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText(/Saved\./).first()).toBeVisible();

  await visitor.goto("/menu");
  await expect(menuCard(visitor, "Margherita")).toContainText("₹199");

  const preview = await page.context().newPage();
  await preview.goto("/api/preview?path=/menu");
  await expect(preview.getByText(/Preview: you're seeing unpublished changes/)).toBeVisible();
  await expect(menuCard(preview, "Margherita")).toContainText("₹249");
  await preview.goto("/api/preview/exit");

  await publish(page);
  await visitor.goto("/menu");
  await expect(menuCard(visitor, "Margherita")).toContainText("₹249");
});

test("out of stock goes live instantly without publishing", async ({ page, browser }) => {
  await login(page);
  const visitor = await (await browser.newContext()).newPage();
  await page.goto("/admin/menu");
  await page.getByRole("switch", { name: "Pepperoni available" }).click();
  await expect(page.getByText(/Marked out of stock \(live now\)/)).toBeVisible();

  await visitor.goto("/menu");
  await expect(menuCard(visitor, "Pepperoni")).toContainText(/sold out/i);

  await page.getByRole("switch", { name: "Pepperoni available" }).click();
  await expect(page.getByText(/Back in stock/)).toBeVisible();
  await visitor.goto("/menu");
  await expect(menuCard(visitor, "Pepperoni")).not.toContainText(/sold out/i);
});

test("hero headline, reviews and opening hours are managed from the CMS", async ({ page, browser }) => {
  await login(page);

  await page.goto("/admin/homepage");
  await page.getByLabel("Headline").fill("Barasat's *hottest* test slice");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText(/Saved\./).first()).toBeVisible();

  await page.goto("/admin/reviews");
  await page.getByRole("switch", { name: "Show review by Sample reviewer 1" }).click();
  await expect(page.getByText(/Review hidden/)).toBeVisible();

  await page.goto("/admin/contact");
  await page.getByLabel("Phone").fill("+91 98765 43210");
  await page.getByRole("switch", { name: "Monday open" }).first().click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText(/Saved\./).first()).toBeVisible();

  await publish(page);

  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto("/");
  await expect(visitor.getByRole("heading", { level: 1 })).toContainText(/hottest/i);
  await expect(visitor.getByText("Sample reviewer 1")).toHaveCount(0);
  await expect(visitor.getByText("Sample reviewer 2")).toBeVisible();
  await expect(visitor.locator("#contact")).toContainText("+91 98765 43210");
  await expect(visitor.locator("#contact")).toContainText("Monday");
});

test("owner can add an offer that appears on the homepage", async ({ page, browser }) => {
  await login(page);
  await page.goto("/admin/offers/new");
  await page.getByLabel("Title").fill("E2E Weekend Deal");
  await page.getByLabel("Offer price").fill("399");
  await page.getByRole("button", { name: "Add offer" }).click();
  await page.waitForURL(/\/admin\/offers\/[0-9a-f-]{36}/);
  await publish(page);

  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto("/");
  await expect(visitor.locator("#offers")).toContainText("E2E Weekend Deal");
  await expect(visitor.locator("#offers")).toContainText("₹399");
});

test("new orders appear in the admin and can be progressed", async ({ page }) => {
  await login(page);
  await page.goto("/admin/orders");
  const first = page.locator("#admin-main ul li a").first();
  await expect(first).toContainText(/HP-\d+/);
  await first.click();
  await page.getByRole("button", { name: /mark as confirmed/i }).click();
  await expect(page.getByText(/Order marked “Confirmed”/)).toBeVisible();
});
