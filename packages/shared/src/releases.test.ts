import { describe, expect, it } from "vitest";
import { releaseListQuerySchema, releaseReviewDecisionSchema } from "./releases.js";

describe("release contracts", () => {
  it("applies bounded public-feed pagination defaults", () => {
    expect(releaseListQuerySchema.parse({})).toEqual({ page: 1, limit: 12 });
    expect(releaseListQuerySchema.safeParse({ page: 10_001 }).success).toBe(false);
  });

  it("requires explicit verification before a release can be published", () => {
    expect(releaseReviewDecisionSchema.safeParse({ decision: "publish", content: {}, verificationConfirmed: false }).success).toBe(false);
  });
});
