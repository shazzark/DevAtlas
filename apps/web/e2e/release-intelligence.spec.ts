import { expect, test } from "@playwright/test";

test("release feed shows an accessible empty state for a safe nonmatching filter", async ({ page }) => {
  await page.goto("/whats-new?technologySlug=devatlas-e2e-empty");
  await expect(page.getByRole("heading", { name: "What’s new" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No reviewed releases yet" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore technologies" })).toHaveAttribute("href", "/tools");
});

test("release feed validation errors use a safe API error contract", async ({ request }) => {
  const response = await request.get("/api/releases?page=0");
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: { code: "INVALID_QUERY", message: "Release filters are invalid" } });
});

test("unpublished or unknown release slugs render a not-found recovery page", async ({ page }) => {
  await page.goto("/releases/devatlas-e2e-not-found");
  await expect(page.getByRole("heading", { name: "Release not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse reviewed releases" })).toHaveAttribute("href", "/whats-new");
});

test("release feed stays responsive and follows both app themes", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("devatlas-theme", "light"));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/whats-new?technologySlug=devatlas-e2e-empty");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
