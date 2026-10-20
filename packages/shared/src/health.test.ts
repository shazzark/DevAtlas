import { describe, expect, it } from "vitest";
import { healthResponseSchema, readinessResponseSchema } from "./health.js";
import { technologyListQuerySchema } from "./technologies.js";

describe("shared health response contracts", () => {
  it("accepts the liveness response", () => {
    expect(healthResponseSchema.parse({ status: "ok" })).toEqual({ status: "ok" });
  });

  it("accepts both readiness outcomes and rejects other shapes", () => {
    expect(readinessResponseSchema.safeParse({ status: "ready" }).success).toBe(true);
    expect(readinessResponseSchema.safeParse({ status: "not_ready", message: "Database unavailable" }).success).toBe(true);
    expect(readinessResponseSchema.safeParse({ status: "ready", secret: "hidden" }).success).toBe(false);
  });
});

describe("technology list contract", () => {
  it("defaults pagination and constrains category and page size", () => {
    expect(technologyListQuerySchema.parse({ category: "database" })).toEqual({ category: "database", page: 1, limit: 12 });
    expect(technologyListQuerySchema.safeParse({ category: "other" }).success).toBe(false);
    expect(technologyListQuerySchema.safeParse({ limit: 49 }).success).toBe(false);
    expect(technologyListQuerySchema.safeParse({ page: 10_001 }).success).toBe(false);
  });
});
