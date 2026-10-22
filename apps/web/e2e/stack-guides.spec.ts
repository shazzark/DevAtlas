import { expect, test } from "@playwright/test";

test("stack guide explorer shows a helpful empty state for an unmatched search", async ({ page }) => {
  await page.goto("/stacks?q=devatlas-e2e-no-guide-match-92741");
  await expect(page.getByRole("heading", { name: "Stack Guides", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No stack guides found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/stacks");
  await expect(page.getByRole("link", { name: "Stack guides" }).first()).toHaveAttribute("href", "/stacks");
});

test("stack guide filters are validated at the same-origin API boundary", async ({ request }) => {
  const response = await request.get("/api/stacks?page=0");
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: { code: "INVALID_QUERY", message: "Stack guide filters are invalid" } });
});

test("unknown stack guides have a published-content-safe recovery page", async ({ page }) => {
  await page.goto("/stacks/devatlas-e2e-not-published-92741");
  await expect(page.getByRole("heading", { name: "Stack guide not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse stack guides" })).toHaveAttribute("href", "/stacks");
});

test("stack explorer reflows at mobile, tablet, and desktop widths", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/stacks?q=devatlas-e2e-no-guide-match-92741");
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
