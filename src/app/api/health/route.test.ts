import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  connectToDatabase: vi.fn(() => {
    throw new Error("Health endpoint must not connect to the database");
  }),
  MissingMongoUriError: class MissingMongoUriError extends Error {},
}));

import { GET } from "./route";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a successful process health response without requiring MongoDB", async () => {
    vi.stubEnv("MONGODB_URI", "");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
