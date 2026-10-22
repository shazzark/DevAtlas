import { describe, expect, it, vi } from "vitest";
import { buildApp } from "../../app.js";
import { parseEnvironment } from "../../config.js";
import { SearchService } from "./service.js";

const config = parseEnvironment({ HOST: "127.0.0.1", PORT: "4001", MONGODB_URI: "", LOG_LEVEL: "silent" });

describe("search route", () => {
  it("validates filters and fails clearly when MongoDB is unavailable", async () => {
    const connectDatabase = vi.fn(async () => { throw new Error("private database URI"); });
    const app = await buildApp(config, { connectDatabase, closeDatabase: async () => undefined, recordSearchMetric: async () => undefined });
    const invalid = await app.inject({ method: "GET", url: "/api/search?category=unknown" });
    const unavailable = await app.inject({ method: "GET", url: "/api/search?q=react" });
    await app.close();
    expect(invalid.statusCode).toBe(400);
    expect(connectDatabase).toHaveBeenCalledTimes(1);
    expect(unavailable.statusCode).toBe(503);
    expect(unavailable.body).not.toContain("private database URI");
  });

  it("serves the validated unified contract", async () => {
    const service = new SearchService({ search: async () => ({ items: [], related: [], pagination: { page: 1, limit: 12, totalItems: 0, totalPages: 0 } }) } as never);
    const app = await buildApp(config, { searchService: service, connectDatabase: async () => undefined, recordSearchMetric: async () => undefined });
    const response = await app.inject({ method: "GET", url: "/api/search?q=react&category=technology" });
    await app.close();
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ items: [], related: [], pagination: { page: 1, limit: 12 } });
  });
});
