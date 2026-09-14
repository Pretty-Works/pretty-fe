import { expect, test } from "@playwright/test";

test("앱 첫 화면에 정상적으로 진입한다", async ({ page }) => {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });

  expect(response?.ok()).toBe(true);
  await expect(page.locator("body")).toBeVisible();
});
