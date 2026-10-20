import { expect, test } from "@playwright/test";

test("home page shows its core message and reviewed-release empty state", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /The tools move fast\.\s*Make sense of them\./,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("There are no reviewed releases to show yet."),
  ).toBeVisible();

  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: /new/i })
    .click();
  await expect(page).toHaveURL(/#whats-new$/);
  await expect(page.locator("#whats-new")).toBeVisible();
});

test("theme toggle changes the document theme", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("devatlas-theme", "light");
  });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const lightCanvas = await page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor);
  const headerPosition = await page.locator("header").evaluate((element) => getComputedStyle(element).position);
  expect(headerPosition).toBe("sticky");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(lightCanvas);
});

test("keyboard navigation reveals the skip link", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});

test("mobile navigation opens at 375px and the page has no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Explore" }),
  ).toBeVisible();

  const mobileOverflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(mobileOverflows).toBe(false);

  await page.setViewportSize({ width: 768, height: 1024 });
  const tabletOverflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(tabletOverflows).toBe(false);

  await page.setViewportSize({ width: 1280, height: 900 });
  const desktopOverflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(desktopOverflows).toBe(false);
});
