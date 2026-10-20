import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../../app.js";
import { parseEnvironment } from "../../config.js";
import { TechnologyService } from "./service.js";

const config = parseEnvironment({ HOST: "127.0.0.1", PORT: "4001", MONGODB_URI: "", LOG_LEVEL: "silent" });

describe("technology HTTP routes", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns a stable 400 error for invalid list filters", async () => {
    const app = buildApp(config, { checkDatabase: async () => undefined, closeDatabase: async () => undefined });
    const response = await app.inject({ method: "GET", url: "/api/technologies?category=not-a-category" });
    await app.close();
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: { code: "INVALID_QUERY", message: "Technology filters are invalid" } });
  });

  it("returns a safe unavailable response when MongoDB cannot connect", async () => {
    const app = buildApp(config, { checkDatabase: async () => undefined, connectDatabase: async () => { throw new Error("private URI detail"); }, closeDatabase: async () => undefined });
    const response = await app.inject({ method: "GET", url: "/api/technologies" });
    await app.close();
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: { code: "DATABASE_UNAVAILABLE", message: "Technology service is temporarily unavailable" } });
    expect(response.body).not.toContain("private URI detail");
  });

  it("returns a technology detail or a stable not-found response", async () => {
    const service = new TechnologyService({ findPublishedBySlug: vi.fn(async () => null) } as never);
    const app = buildApp(config, { checkDatabase: async () => undefined, connectDatabase: async () => undefined, closeDatabase: async () => undefined, technologyService: service });
    const response = await app.inject({ method: "GET", url: "/api/technologies/no-such-technology" });
    await app.close();
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: { code: "NOT_FOUND", message: "Technology not found" } });
  });
});
