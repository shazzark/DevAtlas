import { expect, test } from "@playwright/test";

test("health endpoint reports that the application is running", async ({
  request,
}) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  await expect(response).toBeOK();
  await expect(response.json()).resolves.toEqual({ status: "ok" });
});

test("frontend BFF proxies backend readiness safely", async ({ request }) => {
  const response = await request.get("/api/health/ready");
  const body = await response.json();

  if (body.status === "ready") {
    expect(response.status()).toBe(200);
  } else {
    expect(response.status()).toBe(503);
    expect(body.status).toBe("not_ready");
  }
});

test("Fastify exposes its own liveness endpoint", async ({ request }) => {
  const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:4001";
  const response = await request.get(`${apiBaseUrl}/api/health`);

  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toEqual({ status: "ok" });
});
