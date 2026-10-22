import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerAdminContentRoutes } from "./content-routes.js";

describe("admin content route authorization", () => {
  it("returns service unavailable when authorization is not configured", async () => {
    const app = Fastify(); registerAdminContentRoutes(app); await app.ready();
    const response = await app.inject({ method: "GET", url: "/api/admin/content/technologies" });
    expect(response.statusCode).toBe(503);
    await app.close();
  });

  it("rejects requests when the configured authorizer denies the actor", async () => {
    const app = Fastify(); registerAdminContentRoutes(app, { authorize: async () => null }); await app.ready();
    const response = await app.inject({ method: "GET", url: "/api/admin/content/technologies" });
    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
