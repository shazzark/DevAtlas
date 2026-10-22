import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../../app.js";
import { parseEnvironment } from "../../config.js";
import type { ReleaseRepository } from "./repository.js";
import { ReleaseService } from "./service.js";
import type { ReleaseMonitorService } from "./monitor-service.js";

const config = parseEnvironment({ HOST: "127.0.0.1", PORT: "4001", MONGODB_URI: "", LOG_LEVEL: "silent" });
const content = {
  summary: "This release adds a source-backed improvement to the tested technology for project teams.",
  whyItMatters: "The change matters because it helps developers understand a verified behavior and plan a safer upgrade.",
  importantChanges: [{ title: "Improvement", description: "An official source documents the change.", importance: "medium" }],
  breakingChanges: [],
  migrationGuidance: "Review the linked official release notes and run the project test suite before upgrading.",
  upgradeConsiderations: ["Check compatibility with the versions used by your project."],
  codeExamples: [],
};

describe("release routes", () => {
  afterEach(() => vi.restoreAllMocks());

  it("serves published feed contracts and validates user filters", async () => {
    const repository = {
      listPublished: vi.fn(async () => ({ items: [], pagination: { page: 1, limit: 12, totalItems: 0, totalPages: 0 } })),
      findPublishedBySlug: vi.fn(async () => null),
    };
    const app = await buildApp(config, { releaseService: new ReleaseService(repository as unknown as ReleaseRepository), connectDatabase: async () => undefined });
    const list = await app.inject({ method: "GET", url: "/api/releases" });
    const invalid = await app.inject({ method: "GET", url: "/api/releases?technologySlug=not%20a%20slug" });
    const missing = await app.inject({ method: "GET", url: "/api/releases/not-found" });
    await app.close();

    expect(list.statusCode).toBe(200);
    expect(list.json()).toEqual({ items: [], pagination: { page: 1, limit: 12, totalItems: 0, totalPages: 0 } });
    expect(invalid.statusCode).toBe(400);
    expect(missing.statusCode).toBe(404);
  });

  it("fails closed when review authorization is missing or denies the request", async () => {
    const service = new ReleaseService({ listCandidates: vi.fn(async () => []) } as unknown as ReleaseRepository);
    const unconfigured = await buildApp(config, { releaseService: service });
    const unavailable = await unconfigured.inject({ method: "GET", url: "/api/admin/releases/candidates" });
    await unconfigured.close();
    expect(unavailable.statusCode).toBe(503);
    expect(unavailable.json()).toMatchObject({ error: { code: "REVIEW_AUTH_UNAVAILABLE" } });

    const denied = await buildApp(config, { releaseService: service, authorizeReleaseReview: async () => null });
    const response = await denied.inject({ method: "GET", url: "/api/admin/releases/candidates" });
    await denied.close();
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  it("attaches the trusted actor to a review action and reports source failures distinctly", async () => {
    const repository = {
      listCandidates: vi.fn(async () => []),
      findEditorialStatus: vi.fn().mockResolvedValueOnce("draft"),
      updateEditorialDecision: vi.fn(async () => ({ slug: "react-19-npm-react", status: "review", lastVerifiedAt: null })),
    };
    const monitor = { run: vi.fn(async () => ({ checkedAt: "2026-10-20T12:00:00.000Z", checkedSources: 7, failedSources: 1, newCandidates: 0, discoveredCandidates: 0, failures: [{ sourceKey: "npm:react", code: "SOURCE_RATE_LIMITED" }] })) };
    const app = await buildApp(config, {
      releaseService: new ReleaseService(repository as unknown as ReleaseRepository),
      releaseMonitor: monitor as unknown as ReleaseMonitorService,
      authorizeReleaseReview: async () => ({ actorId: "reviewer-test" }),
      connectDatabase: async () => undefined,
      adminAudit: async () => undefined,
    });
    const review = await app.inject({ method: "PATCH", url: "/api/admin/releases/react-19-npm-react/review", payload: { decision: "submit_for_review", content } });
    const monitorResponse = await app.inject({ method: "POST", url: "/api/admin/releases/monitor" });
    await app.close();

    expect(review.statusCode).toBe(200);
    expect(repository.updateEditorialDecision).toHaveBeenCalledWith("react-19-npm-react", "draft", "review", content);
    expect(monitorResponse.statusCode).toBe(207);
    expect(monitorResponse.json()).toMatchObject({ failedSources: 1, failures: [{ code: "SOURCE_RATE_LIMITED" }] });
  });
});
