import { expect, test } from "@playwright/test";

test("build guide explorer shows an empty state for an unmatched query", async ({ page }) => {
  await page.goto("/builds?q=devatlas-e2e-no-build-match-92741");
  await expect(page.getByRole("heading", { name: "Build Guides", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No build guides found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/builds");
  await expect(page.getByRole("link", { name: "Build guides" }).first()).toHaveAttribute("href", "/builds");
});

test("build guide list filters are validated by the same-origin BFF", async ({ request }) => {
  const response = await request.get("/api/builds?page=0");
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: { code: "INVALID_QUERY", message: "Build guide filters are invalid" } });
});

test("unknown build guide has a recovery page", async ({ page }) => {
  await page.goto("/builds/devatlas-e2e-not-published-92741");
  await expect(page.getByRole("heading", { name: "Build guide not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse build guides" })).toHaveAttribute("href", "/builds");
});

test("build guide explorer reflows at mobile, tablet, and desktop widths", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/builds?q=devatlas-e2e-no-build-match-92741");
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("published build guide exposes copyable code", async ({ page, request, context }) => {
  const response = await request.get("/api/builds?limit=1");
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as { items: Array<{ slug: string }> };
  test.skip(body.items.length === 0, "No published build guide is available in the test database");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(`/builds/${body.items[0].slug}`);
  const copyButton = page.getByRole("button", { name: "Copy" }).first();
  await expect(copyButton).toBeVisible();
  await copyButton.click();
  await expect(page.getByRole("button", { name: "Copied" }).first()).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBeTruthy();
});
