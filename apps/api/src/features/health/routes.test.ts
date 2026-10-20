import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../../app.js";
import { parseEnvironment } from "../../config.js";

const config = parseEnvironment({ HOST: "127.0.0.1", PORT: "4001", MONGODB_URI: "", LOG_LEVEL: "silent" });

describe("Fastify health routes", () => {
  afterEach(() => vi.restoreAllMocks());

  it("reports liveness without checking MongoDB", async () => {
    const checkDatabase = vi.fn(async () => { throw new Error("should not be called"); });
    const app = buildApp(config, { checkDatabase });
    const response = await app.inject({ method: "GET", url: "/api/health" });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
    expect(checkDatabase).not.toHaveBeenCalled();
  });

  it("reports a safe unavailable response when the database check fails", async () => {
    const app = buildApp(config, { checkDatabase: async () => { throw new Error("private connection detail"); } });
    const response = await app.inject({ method: "GET", url: "/api/health/ready" });
    await app.close();

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: "not_ready", message: "Database unavailable" });
    expect(response.body).not.toContain("private connection detail");
  });

  it("reports ready only after the database check resolves", async () => {
    const checkDatabase = vi.fn(async () => undefined);
    const app = buildApp(config, { checkDatabase });
    const response = await app.inject({ method: "GET", url: "/api/health/ready" });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ready" });
    expect(checkDatabase).toHaveBeenCalledOnce();
  });
});
