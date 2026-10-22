import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../app.js";
import { parseEnvironment } from "../../config.js";
import { TechnologyModel } from "../technologies/model.js";
import { ReleaseModel } from "../releases/models.js";
import { StackGuideModel } from "../stack-guides/model.js";
import { BuildGuideModel } from "../build-guides/model.js";

const uri = process.env.PHASE6_MONGODB_TEST_URI;
const suite = uri ? describe : describe.skip;
const techSlug = "phase6-search-fixture-postgres";
const otherTechSlug = "phase6-search-fixture-other";
const stackSlug = "phase6-search-fixture-stack";
const hiddenSlug = "phase6-search-fixture-unverified";

suite("unified search MongoDB integration", () => {
  const config = parseEnvironment({ MONGODB_URI: uri, HOST: "127.0.0.1", PORT: "4001", LOG_LEVEL: "silent" });
  let app: Awaited<ReturnType<typeof buildApp>>;
  beforeAll(async () => {
    await mongoose.connect(uri!);
    app = await buildApp(config, { checkDatabase: async () => undefined, closeDatabase: async () => undefined });
    await Promise.all([TechnologyModel.init(), ReleaseModel.init(), StackGuideModel.init(), BuildGuideModel.init()]);
    await TechnologyModel.deleteMany({ slug: { $in: [techSlug, otherTechSlug] } });
    await StackGuideModel.deleteMany({ slug: { $in: [stackSlug, hiddenSlug] } });
    const technologyFixture = (slug: string, name: string) => ({ slug, name, category: "database" as const, shortDescription: "Search fixture for relational data.", overview: "PostgreSQL search fixture.", primaryUseCases: [], whenToUse: [], whenNotToUse: [], installation: "Fixture", gettingStarted: "Fixture", status: "published" as const });
    await TechnologyModel.create([technologyFixture(techSlug, "Fixture Search PostgreSQL"), technologyFixture(otherTechSlug, "Fixture Other Database")]);
    const common = { summary: "Search fixture for PostgreSQL integration.", technologySlugs: [techSlug, otherTechSlug], prerequisites: ["Fixture"], compatibility: ["Fixture"], architecture: "Fixture architecture.", steps: [{ title: "Fixture", explanation: "Search fixture.", code: { title: "Fixture", language: "text", code: "fixture", explanation: "Fixture" } }], troubleshooting: [{ problem: "Fixture", solution: "Fixture" }], references: [{ label: "PostgreSQL docs", url: "https://www.postgresql.org/docs/" }] };
    await StackGuideModel.create([
      { ...common, slug: stackSlug, title: "Fixture PostgreSQL Stack Guide", status: "published", lastVerifiedAt: new Date() },
      { ...common, slug: hiddenSlug, title: "Unverified PostgreSQL Stack Guide", status: "published", lastVerifiedAt: null },
    ]);
    await app.ready();
  });
  afterAll(async () => {
    await app.close();
    await StackGuideModel.deleteMany({ slug: { $in: [stackSlug, hiddenSlug] } });
    await TechnologyModel.deleteMany({ slug: { $in: [techSlug, otherTechSlug] } });
    await mongoose.disconnect();
  });

  it("returns relevant public records, supports filters, recommends related content and hides unverified records", async () => {
    const response = await app.inject({ method: "GET", url: "/api/search?q=PostgreSQL&category=technology" });
    expect(response.statusCode, response.body).toBe(200);
    const body = response.json();
    expect(body.items.map((item: { slug: string }) => item.slug)).toContain(techSlug);
    expect(body.items.map((item: { slug: string }) => item.slug)).not.toContain(stackSlug);
    expect(body.related.map((item: { slug: string }) => item.slug)).toContain(stackSlug);
    expect(body.items.map((item: { slug: string }) => item.slug)).not.toContain(hiddenSlug);
    const category = await app.inject({ method: "GET", url: "/api/search?q=PostgreSQL&category=stack&technologySlug=phase6-search-fixture-postgres" });
    expect(category.json().items.map((item: { slug: string }) => item.slug)).toEqual([stackSlug]);
  });
});
