import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseEnvironment } from "../../config.js";
import { buildApp } from "../../app.js";
import { AdminAuditEventModel } from "./audit-model.js";
import { TechnologyModel } from "../technologies/model.js";
import { StackGuideModel } from "../stack-guides/model.js";
import { BuildGuideModel } from "../build-guides/model.js";

const uri = process.env.PHASE6_MONGODB_TEST_URI;
const suite = uri ? describe : describe.skip;
const slug = "phase6-admin-fixture-tech";
const guideSlug = "phase6-admin-fixture-guide";

suite("admin content workflow integration", () => {
  const config = parseEnvironment({ HOST: "127.0.0.1", PORT: "4001", LOG_LEVEL: "silent" });
  let app: Awaited<ReturnType<typeof buildApp>>;
  const dependencies = {
    checkDatabase: async () => undefined, connectDatabase: async () => undefined,
    closeDatabase: async () => undefined,
    authorizeReleaseReview: async (request: import("fastify").FastifyRequest) => request.headers.authorization === "Bearer accepted-test-token" ? { actorId: "123456" } : null,
  };

  beforeAll(async () => {
    await mongoose.connect(uri!);
    app = await buildApp(config, dependencies);
    await TechnologyModel.init(); await StackGuideModel.init(); await BuildGuideModel.init(); await AdminAuditEventModel.init();
    await TechnologyModel.deleteMany({ slug }); await StackGuideModel.deleteMany({ slug: guideSlug }); await BuildGuideModel.deleteMany({ slug: guideSlug });
    await AdminAuditEventModel.deleteMany({ entitySlug: { $in: [slug, guideSlug] } });
    await app.ready();
  });
  afterAll(async () => {
    await app.close();
    await TechnologyModel.deleteMany({ slug }); await StackGuideModel.deleteMany({ slug: guideSlug }); await BuildGuideModel.deleteMany({ slug: guideSlug });
    await AdminAuditEventModel.deleteMany({ entitySlug: { $in: [slug, guideSlug] } });
    await mongoose.disconnect();
  });

  it("denies access without a valid admin actor", async () => {
    const response = await app.inject({ method: "GET", url: "/api/admin/content/technologies" });
    expect(response.statusCode).toBe(401);
  });

  it("creates, edits, reviews, publishes, and audits content with compare-and-set transitions", async () => {
    const headers = { authorization: "Bearer accepted-test-token" };
    const content = {
      slug, name: "Phase 6 Fixture", category: "tooling", shortDescription: "Admin test fixture", overview: "A fixture technology for testing admin workflow.",
      primaryUseCases: ["testing"], whenToUse: ["testing"], whenNotToUse: [], installation: "npm install fixture", gettingStarted: "Start here.",
      keyConcepts: [], codeExamples: [], alternatives: [], relatedSlugs: [], officialLinks: [{ label: "Official fixture docs", url: "https://example.com/docs" }],
      version: { current: "1.0.0", releasedAt: null, sourceUrl: "https://example.com/releases", lastVerifiedAt: new Date().toISOString() },
    };
    const created = await app.inject({ method: "POST", url: "/api/admin/content/technologies", headers, payload: { content } });
    expect(created.statusCode, created.body).toBe(201);
    expect(created.json().item.status).toBe("draft");

    const submitted = await app.inject({ method: "PATCH", url: `/api/admin/content/technologies/${slug}/workflow`, headers, payload: { expectedStatus: "draft", status: "review" } });
    expect(submitted.statusCode).toBe(200);
    const unconfirmed = await app.inject({ method: "PATCH", url: `/api/admin/content/technologies/${slug}/workflow`, headers, payload: { expectedStatus: "review", status: "published" } });
    expect(unconfirmed.statusCode).toBe(400);
    const published = await app.inject({ method: "PATCH", url: `/api/admin/content/technologies/${slug}/workflow`, headers, payload: { expectedStatus: "review", status: "published", verificationConfirmed: true } });
    expect(published.statusCode).toBe(200);

    const publicRecord = await app.inject({ method: "GET", url: `/api/technologies/${slug}` });
    expect(publicRecord.statusCode).toBe(200);
    expect(publicRecord.json().item.slug).toBe(slug);
    const audit = await AdminAuditEventModel.find({ entitySlug: slug }).sort({ createdAt: 1 }).lean();
    expect(audit.map((event) => event.action)).toEqual([
      "content.create.requested", "content.created",
      "content.status.review.requested", "content.status.review",
      "content.status.published.requested", "content.status.published",
    ]);
    expect(audit.every((event) => event.actorId === "123456")).toBe(true);
  });
});
