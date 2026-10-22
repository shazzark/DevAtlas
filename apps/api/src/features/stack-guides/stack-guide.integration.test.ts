import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../app.js";
import { parseEnvironment } from "../../config.js";
import { TechnologyModel } from "../technologies/model.js";
import { StackGuideModel } from "./model.js";

const uri = process.env.PHASE4_MONGODB_TEST_URI;
const suite = uri ? describe : describe.skip;
const technologySlugs = ["phase4-fixture-react", "phase4-fixture-typescript", "phase4-fixture-draft-tech"];
const guideSlugs = ["phase4-fixture-public-guide", "phase4-fixture-draft-guide", "phase4-fixture-hidden-related"];

suite("stack guide MongoDB integration", () => {
  const config = parseEnvironment({ MONGODB_URI: uri, HOST: "127.0.0.1", PORT: "4001", LOG_LEVEL: "silent" });
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    await mongoose.connect(uri!);
    app = await buildApp(config, { checkDatabase: async () => undefined, closeDatabase: async () => undefined });
    await TechnologyModel.init();
    await StackGuideModel.init();
    await TechnologyModel.deleteMany({ slug: { $in: technologySlugs } });
    await StackGuideModel.deleteMany({ slug: { $in: guideSlugs } });
    await TechnologyModel.create([
      { slug: technologySlugs[0], name: "Fixture React", category: "frontend", shortDescription: "Fixture technology.", overview: "Fixture technology.", primaryUseCases: [], whenToUse: [], whenNotToUse: [], installation: "Fixture", gettingStarted: "Fixture", status: "published" },
      { slug: technologySlugs[1], name: "Fixture TypeScript", category: "language", shortDescription: "Fixture technology.", overview: "Fixture technology.", primaryUseCases: [], whenToUse: [], whenNotToUse: [], installation: "Fixture", gettingStarted: "Fixture", status: "published" },
      { slug: technologySlugs[2], name: "Fixture draft", category: "language", shortDescription: "Fixture technology.", overview: "Fixture technology.", primaryUseCases: [], whenToUse: [], whenNotToUse: [], installation: "Fixture", gettingStarted: "Fixture", status: "draft" },
    ]);
    const common = {
      title: "Phase 4 fixture guide", summary: "A searchable guide fixture.", technologySlugs: technologySlugs.slice(0, 2),
      prerequisites: ["Fixture prerequisite"], compatibility: ["Check official release support."], architecture: "Fixture architecture.",
      steps: [{ title: "Fixture step", explanation: "Fixture explanation.", code: { title: "Example", language: "typescript", code: "const ready = true;", explanation: "Fixture code." } }],
      troubleshooting: [{ problem: "Fixture issue", solution: "Fixture fix." }], references: [{ label: "Official docs", url: "https://react.dev/learn" }], lastVerifiedAt: new Date("2026-10-22T00:00:00.000Z"),
    };
    await StackGuideModel.create([
      { ...common, slug: guideSlugs[0], status: "published" },
      { ...common, slug: guideSlugs[1], status: "draft" },
    ]);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await StackGuideModel.deleteMany({ slug: { $in: guideSlugs } });
    await TechnologyModel.deleteMany({ slug: { $in: technologySlugs } });
    await mongoose.disconnect();
  });

  it("lists and filters published guides only", async () => {
    const response = await app.inject({ method: "GET", url: "/api/stacks?q=searchable&technologySlug=phase4-fixture-react" });
    expect(response.statusCode, response.body).toBe(200);
    expect(response.json().items.map((item: { slug: string }) => item.slug)).toEqual([guideSlugs[0]]);
    expect(response.json().items[0].technologies).toEqual([
      { slug: technologySlugs[0], name: "Fixture React" },
      { slug: technologySlugs[1], name: "Fixture TypeScript" },
    ]);
  });

  it("does not expose drafts or guides with a draft technology relationship", async () => {
    await StackGuideModel.create({ slug: "phase4-fixture-hidden-related", status: "published", title: "Hidden relation", summary: "Hidden", technologySlugs: [technologySlugs[0], technologySlugs[2]], prerequisites: ["Fixture"], compatibility: ["Fixture"], architecture: "Fixture", steps: [{ title: "Fixture", explanation: "Fixture", code: { title: "Fixture", language: "text", code: "fixture", explanation: "Fixture" } }], troubleshooting: [{ problem: "Fixture", solution: "Fixture" }], references: [{ label: "Official docs", url: "https://react.dev/learn" }], lastVerifiedAt: new Date() });
    const draft = await app.inject({ method: "GET", url: `/api/stacks/${guideSlugs[1]}` });
    const hiddenRelation = await app.inject({ method: "GET", url: "/api/stacks/phase4-fixture-hidden-related" });
    expect(draft.statusCode).toBe(404);
    expect(hiddenRelation.statusCode).toBe(404);
  });
});
