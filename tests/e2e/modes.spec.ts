import { expect, test } from "@playwright/test";
import { login, publish } from "./helpers";

test.describe.configure({ mode: "serial" });

async function addPizzaAndCheckout(page: import("@playwright/test").Page) {
  await page.goto("/menu");
  await page.getByRole("button", { name: "Add Cola to cart" }).click();
  await page.goto("/checkout");
}

test("WhatsApp ordering saves the order and prepares the message", async ({ page, browser }) => {
  const admin = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await login(admin);
  await admin.goto("/admin/ordering");
  await admin.getByText("WhatsApp", { exact: true }).click();
  await admin.getByLabel("WhatsApp number for orders").fill("98765 43210");
  await admin.getByRole("button", { name: "Save changes" }).click();
  await expect(admin.getByText(/Saved\./).first()).toBeVisible();
  await publish(admin);

  await addPizzaAndCheckout(page);
  await page.getByText("Pickup", { exact: true }).click();
  await page.getByLabel("Your name").fill("WA Customer");
  await page.getByLabel("Mobile number").fill("9876501234");
  await page.getByRole("button", { name: /continue to whatsapp/i }).click();
  await page.waitForURL("**/order/**");
  const wa = page.getByRole("link", { name: /send order on whatsapp/i });
  await expect(wa).toHaveAttribute("href", /^https:\/\/wa\.me\/919876543210\?text=/);
  const href = decodeURIComponent((await wa.getAttribute("href")) ?? "");
  expect(href).toContain("1 × Cola");
  expect(href).toContain("Pickup");

  // External platform handoff
  await admin.goto("/admin/ordering");
  await admin.getByText("Other platform", { exact: true }).click();
  await admin.getByLabel("Platform name").fill("Zomato");
  await admin.getByRole("textbox", { name: /ordering link/i }).fill("https://www.zomato.com/example");
  await admin.getByRole("button", { name: "Save changes" }).click();
  await expect(admin.getByText(/Saved\./).first()).toBeVisible();
  await publish(admin);

  await addPizzaAndCheckout(page);
  await expect(page.getByRole("heading", { name: /order on zomato/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /continue to zomato/i })).toHaveAttribute("href", "https://www.zomato.com/example");

  // Restore website checkout
  await admin.goto("/admin/ordering");
  await admin.getByText("Website checkout", { exact: true }).click();
  await admin.getByRole("button", { name: "Save changes" }).click();
  await expect(admin.getByText(/Saved\./).first()).toBeVisible();
  await publish(admin);
});

test("pausing orders blocks checkout instantly", async ({ page, browser }) => {
  const admin = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await login(admin);
  await admin.goto("/admin/ordering");
  await admin.getByRole("switch", { name: /taking orders/i }).click();
  await expect(admin.getByText(/paused \(live now\)/)).toBeVisible();

  await addPizzaAndCheckout(page);
  await expect(page.getByText(/not taking online orders/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /place order/i })).toBeDisabled();

  await admin.getByRole("switch", { name: /orders are paused/i }).click();
  await expect(admin.getByText(/open \(live now\)/)).toBeVisible();
});
