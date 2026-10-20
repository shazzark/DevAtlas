import { describe, expect, it } from "vitest";
import { healthResponseSchema, readinessResponseSchema } from "./health.js";

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
