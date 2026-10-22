import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../app.js";
import { parseEnvironment } from "../../config.js";
import { TechnologyModel } from "../technologies/model.js";
import { BuildGuideModel } from "./model.js";

const uri = process.env.PHASE5_MONGODB_TEST_URI;
const suite = uri ? describe : describe.skip;
const technologySlugs = ["phase5-fixture-react", "phase5-fixture-nodejs", "phase5-fixture-draft-tech"];
const guideSlugs = ["phase5-fixture-public", "phase5-fixture-draft", "phase5-fixture-hidden-relation"];

suite("build guide MongoDB integration", () => {
  const config = parseEnvironment({ MONGODB_URI: uri, HOST: "127.0.0.1", PORT: "4001", LOG_LEVEL: "silent" });
  const app = buildApp(config, { checkDatabase: async () => undefined, closeDatabase: async () => undefined });

  beforeAll(async () => {
    await mongoose.connect(uri!);
    await TechnologyModel.init();
    await BuildGuideModel.init();
    await TechnologyModel.deleteMany({ slug: { $in: technologySlugs } });
    await BuildGuideModel.deleteMany({ slug: { $in: guideSlugs } });
    await TechnologyModel.create([
      { slug: technologySlugs[0], name: "Fixture React", category: "frontend", shortDescription: "Fixture.", overview: "Fixture.", primaryUseCases: [], whenToUse: [], whenNotToUse: [], installation: "Fixture", gettingStarted: "Fixture", status: "published" },
      { slug: technologySlugs[1], name: "Fixture Node.js", category: "backend", shortDescription: "Fixture.", overview: "Fixture.", primaryUseCases: [], whenToUse: [], whenNotToUse: [], installation: "Fixture", gettingStarted: "Fixture", status: "published" },
      { slug: technologySlugs[2], name: "Fixture draft", category: "backend", shortDescription: "Fixture.", overview: "Fixture.", primaryUseCases: [], whenToUse: [], whenNotToUse: [], installation: "Fixture", gettingStarted: "Fixture", status: "draft" },
    ]);
    const common = {
      title: "Searchable Build Guide Fixture", summary: "A searchable project guide.", learningObjectives: ["Learn a fixture"],
      prerequisites: ["Fixture prerequisite"], technologySlugs: technologySlugs.slice(0, 2), architecture: "Fixture architecture.",
      steps: [{ title: "Fixture step", objective: "Exercise API", explanation: "Fixture explanation.", decision: "Fixture reason.", examples: [{ title: "Fixture code", language: "javascript", code: "const ready = true;", explanation: "Fixture example." }] }],
      testingInstructions: [{ title: "Check fixture", command: "npm test", expectedResult: "Fixture test passes." }],
      commonErrors: [{ problem: "Fixture error", cause: "Fixture cause", solution: "Fixture solution" }],
      outcome: "A fixture result.", references: [{ label: "Official React docs", url: "https://react.dev/learn" }], lastVerifiedAt: new Date("2026-10-22T00:00:00.000Z"),
    };
    await BuildGuideModel.create([
      { ...common, slug: guideSlugs[0], status: "published" },
      { ...common, slug: guideSlugs[1], status: "draft" },
    ]);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await BuildGuideModel.deleteMany({ slug: { $in: guideSlugs } });
    await TechnologyModel.deleteMany({ slug: { $in: technologySlugs } });
    await mongoose.disconnect();
  });

  it("searches published guides and hydrates valid technology names", async () => {
    const response = await app.inject({ method: "GET", url: "/api/build-guides?q=searchable&technologySlug=phase5-fixture-react" });
    expect(response.statusCode, response.body).toBe(200);
    expect(response.json().items.map((item: { slug: string }) => item.slug)).toEqual([guideSlugs[0]]);
    expect(response.json().items[0].technologies).toEqual([
      { slug: technologySlugs[0], name: "Fixture React" },
      { slug: technologySlugs[1], name: "Fixture Node.js" },
    ]);
  });

  it("hides drafts and guides that reference unpublished technologies", async () => {
    await BuildGuideModel.create({ slug: guideSlugs[2], status: "published", title: "Hidden relation", summary: "Hidden", learningObjectives: ["Fixture"], prerequisites: ["Fixture"], technologySlugs: [technologySlugs[0], technologySlugs[2]], architecture: "Fixture", steps: [{ title: "Fixture", objective: "Fixture", explanation: "Fixture", decision: "Fixture", examples: [{ title: "Fixture", language: "text", code: "fixture", explanation: "Fixture" }] }], testingInstructions: [{ title: "Fixture", command: "Fixture", expectedResult: "Fixture" }], commonErrors: [{ problem: "Fixture", cause: "Fixture", solution: "Fixture" }], outcome: "Fixture", references: [{ label: "React docs", url: "https://react.dev/learn" }], lastVerifiedAt: new Date() });
    const draft = await app.inject({ method: "GET", url: `/api/build-guides/${guideSlugs[1]}` });
    const hidden = await app.inject({ method: "GET", url: `/api/build-guides/${guideSlugs[2]}` });
    expect(draft.statusCode).toBe(404);
    expect(hidden.statusCode).toBe(404);
  });
});
