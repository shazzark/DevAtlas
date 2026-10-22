import { expect, test } from "@playwright/test";

test("unified search has filters, empty state, and responsive layout", async ({ page }) => {
  await page.goto("/search?q=devatlas-e2e-no-search-match-92741");
  await expect(page.getByRole("heading", { name: "Search DevAtlas" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Filter by content type" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No matching content" })).toBeVisible();
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("search filters are validated at the same-origin API boundary", async ({ request }) => {
  const response = await request.get("/api/search?category=unknown");
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: { code: "INVALID_QUERY", message: "Search filters are invalid" } });
});
