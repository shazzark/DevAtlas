import { expect, test } from "@playwright/test";

test("health endpoint reports that the application is running", async ({
  request,
}) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  await expect(response).toBeOK();
  await expect(response.json()).resolves.toEqual({ status: "ok" });
});

test("readiness reflects whether a database URI is configured", async ({
  request,
}) => {
  const response = await request.get("/api/health/ready");
  const body = await response.json();

  if (process.env.MONGODB_URI) {
    expect(response.status()).toBe(200);
    expect(body).toEqual({ status: "ready" });
  } else {
    expect(response.status()).toBe(503);
    expect(body.status).toBe("not_ready");
  }
});
