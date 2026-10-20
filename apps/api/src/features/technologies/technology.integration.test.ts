import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../app.js";
import { parseEnvironment } from "../../config.js";
import { TechnologyModel } from "./model.js";

const uri = process.env.PHASE2_MONGODB_TEST_URI;
const suite = uri ? describe : describe.skip;
const fixtureSlugs = ["phase2-fixture-public", "phase2-fixture-public-2", "phase2-fixture-draft"];

suite("technology MongoDB integration", () => {
  const config = parseEnvironment({ MONGODB_URI: uri, HOST: "127.0.0.1", PORT: "4001", LOG_LEVEL: "silent" });
  const app = buildApp(config, { checkDatabase: async () => undefined, closeDatabase: async () => undefined });

  beforeAll(async () => {
    await mongoose.connect(uri!);
    await TechnologyModel.init();
    await TechnologyModel.deleteMany({ slug: { $in: fixtureSlugs } });
    await TechnologyModel.create([
      { slug: fixtureSlugs[0], name: "Phase2 Fixture Public", category: "database", shortDescription: "A public test technology.", overview: "A public test technology record.", primaryUseCases: [], whenToUse: [], whenNotToUse: [], installation: "Test only.", gettingStarted: "Test only.", keyConcepts: [], codeExamples: [], relatedSlugs: [], officialLinks: [], version: { current: null, releasedAt: null, sourceUrl: null, lastVerifiedAt: null }, status: "published" },
      { slug: fixtureSlugs[1], name: "Phase2 Fixture Public Two", category: "database", shortDescription: "A second public test technology.", overview: "Another public test technology record.", primaryUseCases: [], whenToUse: [], whenNotToUse: [], installation: "Test only.", gettingStarted: "Test only.", keyConcepts: [], codeExamples: [], relatedSlugs: [], officialLinks: [], version: { current: null, releasedAt: null, sourceUrl: null, lastVerifiedAt: null }, status: "published" },
      { slug: fixtureSlugs[2], name: "Phase2 Fixture Draft", category: "database", shortDescription: "A draft test technology.", overview: "A draft test technology record.", primaryUseCases: [], whenToUse: [], whenNotToUse: [], installation: "Test only.", gettingStarted: "Test only.", keyConcepts: [], codeExamples: [], relatedSlugs: [], officialLinks: [], version: { current: null, releasedAt: null, sourceUrl: null, lastVerifiedAt: null }, status: "draft" },
    ]);
    await app.ready();
  });
  afterAll(async () => {
    await app.close();
    await TechnologyModel.deleteMany({ slug: { $in: fixtureSlugs } });
    await mongoose.disconnect();
  });

  it("paginates and filters published technologies, excluding drafts", async () => {
    const response = await app.inject({ method: "GET", url: "/api/technologies?category=database&page=1&limit=1&q=Phase2%20Fixture" });
    expect(response.statusCode, response.body).toBe(200);
    const body = response.json();
    expect(body.pagination).toMatchObject({ page: 1, limit: 1, totalItems: 2, totalPages: 2 });
    expect(body.items.map((item: { slug: string }) => item.slug)).toEqual([fixtureSlugs[0]]);
    expect(body.categories).toContain("database");
    const secondPage = await app.inject({ method: "GET", url: "/api/technologies?category=database&page=2&limit=1&q=Phase2%20Fixture" });
    expect(secondPage.json().items.map((item: { slug: string }) => item.slug)).toEqual([fixtureSlugs[1]]);
  });

  it("returns published detail records and hides drafts", async () => {
    const publicResponse = await app.inject({ method: "GET", url: `/api/technologies/${fixtureSlugs[0]}` });
    const draftResponse = await app.inject({ method: "GET", url: `/api/technologies/${fixtureSlugs[2]}` });
    expect(publicResponse.statusCode).toBe(200);
    expect(publicResponse.json().item.slug).toBe(fixtureSlugs[0]);
    expect(draftResponse.statusCode).toBe(404);
  });
});
