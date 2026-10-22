import { expect, test } from "@playwright/test";

test("admin login explains access is limited to approved GitHub accounts", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "Admin sign in" })).toBeVisible();
  if (process.env.AUTH_SECRET && process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET && process.env.ADMIN_GITHUB_IDS && process.env.ADMIN_API_JWT_SECRET) {
    await expect(page.getByRole("button", { name: "Continue with GitHub" })).toBeVisible();
  } else {
    await expect(page.getByRole("status")).toHaveText("Admin sign in is unavailable until its OAuth and signing settings are configured.");
  }
  await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", /noindex/);
});

test("admin BFF rejects requests without an authenticated session", async ({ request }) => {
  const response = await request.get("/api/admin/content/technologies?status=draft");
  expect(response.status()).toBe(401);
  expect(await response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });
});

test("admin BFF enforces same-origin mutations", async ({ request }) => {
  const response = await request.post("/api/admin/releases/monitor", { data: {} });
  expect(response.status()).toBe(403);
  expect(await response.json()).toMatchObject({ error: { code: "INVALID_ORIGIN" } });
});
