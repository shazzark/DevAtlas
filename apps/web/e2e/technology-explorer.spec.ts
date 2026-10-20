import { expect, test } from "@playwright/test";

test("explorer lists technologies and filters by text and category", async ({ page }) => {
  await page.goto("/tools");
  await expect(page.getByRole("heading", { name: "Technology Explorer" })).toBeVisible();
  await expect(page.getByRole("link", { name: /JavaScript/ }).first()).toBeVisible();
  await page.getByRole("textbox", { name: "Search technologies" }).fill("React");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=React/);
  await expect(page.getByRole("link", { name: /React/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /JavaScript/ })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Search technologies" }).fill("");
  await page.getByLabel("Filter by category").selectOption("database");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/category=database/);
  await expect(page.getByRole("link", { name: "PostgreSQL" })).toBeVisible();
  await expect(page.getByRole("link", { name: "MongoDB" })).toBeVisible();
});

test("empty and invalid filter states provide a recovery path", async ({ page }) => {
  await page.goto("/tools?q=devatlas-no-match-expected");
  await expect(page.getByRole("heading", { name: "No technologies found" })).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page.getByRole("heading", { name: "Technology Explorer" })).toBeVisible();
  const invalidFilter = await page.request.get("/api/technologies?category=invalid");
  expect(invalidFilter.status()).toBe(400);
});

test("detail page explains a technology and highlights copyable examples", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/tools/typescript");
  await expect(page.getByRole("heading", { name: "TypeScript", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Overview and purpose" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Alternatives to consider" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "When to use it" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Key concepts" })).toBeVisible();
  await expect(page.getByRole("link", { name: "TypeScript for JavaScript Programmers" })).toHaveAttribute("target", "_blank");
  await expect(page.getByText("Content last verified October 20, 2026")).toBeVisible();
  const code = page.locator("pre code");
  await expect(code.locator(".hljs-keyword").first()).toBeVisible();
  await page.getByRole("button", { name: "Copy" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("type User");
});

test("technology pages stay readable at mobile, tablet, desktop and in both themes", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/tools/nextjs");
  await expect(page.getByRole("heading", { name: "Next.js", level: 1 })).toBeVisible();
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
