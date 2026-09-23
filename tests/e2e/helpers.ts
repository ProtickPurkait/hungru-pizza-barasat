import { expect, type Page } from "@playwright/test";

export const ADMIN = { email: "e2e-owner@hungru.test", password: "e2e-password-123" };

export async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");
}

export async function publish(page: Page) {
  await page.goto("/admin/publish");
  const button = page.getByRole("button", { name: "Publish now" });
  if (await button.isDisabled()) return;
  await button.click();
  await expect(page.getByText(/Published!/).first()).toBeVisible();
}

export function menuCard(page: Page, name: string) {
  return page.locator("article", { has: page.getByRole("button", { name, exact: true }) }).first();
}

export async function openProduct(page: Page, name: string) {
  await page.goto("/admin/menu");
  await page.getByRole("link", { name: new RegExp(name) }).first().click();
  await page.waitForURL(/\/admin\/menu\/[0-9a-f-]{36}/);
}
