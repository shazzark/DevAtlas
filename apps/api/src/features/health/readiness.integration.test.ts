import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../app.js";
import { parseEnvironment } from "../../config.js";

const uri = process.env.PHASE15_MONGODB_TEST_URI;
const suite = uri ? describe : describe.skip;

suite("MongoDB readiness integration", () => {
  const app = buildApp(parseEnvironment({ MONGODB_URI: uri, HOST: "127.0.0.1", PORT: "4001", LOG_LEVEL: "silent" }));

  beforeAll(async () => app.ready());
  afterAll(async () => app.close());

  it("returns ready only after the actual MongoDB deployment responds to ping", async () => {
    const response = await app.inject({ method: "GET", url: "/api/health/ready" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ready" });
  });
});
