import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../../app.js";
import { parseEnvironment } from "../../config.js";
import { BuildGuideService } from "./service.js";

const config = parseEnvironment({ HOST: "127.0.0.1", PORT: "4001", MONGODB_URI: "", LOG_LEVEL: "silent" });

describe("build guide HTTP routes", () => {
  afterEach(() => vi.restoreAllMocks());

  it("validates list filters before connecting to MongoDB", async () => {
    const connectDatabase = vi.fn(async () => undefined);
    const app = await buildApp(config, { connectDatabase, closeDatabase: async () => undefined });
    const response = await app.inject({ method: "GET", url: "/api/build-guides?page=0" });
    await app.close();
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: { code: "INVALID_QUERY", message: "Build guide filters are invalid" } });
    expect(connectDatabase).not.toHaveBeenCalled();
  });

  it("returns a safe unavailable response when MongoDB cannot connect", async () => {
    const app = await buildApp(config, { connectDatabase: async () => { throw new Error("private URI detail"); }, closeDatabase: async () => undefined });
    const response = await app.inject({ method: "GET", url: "/api/build-guides" });
    await app.close();
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: { code: "DATABASE_UNAVAILABLE", message: "Build guide service is temporarily unavailable" } });
    expect(response.body).not.toContain("private URI detail");
  });

  it("rejects malformed slugs and hides unpublished records", async () => {
    const service = new BuildGuideService({ findPublishedBySlug: vi.fn(async () => null) } as never);
    const app = await buildApp(config, { connectDatabase: async () => undefined, closeDatabase: async () => undefined, buildGuideService: service });
    const invalid = await app.inject({ method: "GET", url: "/api/build-guides/not-valid!" });
    const missing = await app.inject({ method: "GET", url: "/api/build-guides/unpublished-guide" });
    await app.close();
    expect(invalid.statusCode).toBe(400);
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toEqual({ error: { code: "NOT_FOUND", message: "Build guide not found" } });
  });
});
