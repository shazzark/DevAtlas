import { afterAll, beforeAll, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { TechnologyModel } from "../technologies/model.js";
import { ReleaseModel, ReleaseSourceModel } from "./models.js";
import { ReleaseRepository } from "./repository.js";
import { ReleaseService } from "./service.js";
import type { ReleaseSourceDefinition } from "./source-definitions.js";

const uri = process.env.PHASE3_MONGODB_TEST_URI;
const suite = uri ? describe : describe.skip;
const technologySlug = "phase3-test-release-tech";
const sourceKey = "phase3-test:release-source";
const releaseSlug = "phase3-test-release-tech-1-2-3-phase3-test-release-source";
const definition: ReleaseSourceDefinition = {
  sourceKey, technologySlug, technologyName: "Phase 3 Fixture", kind: "npm-latest",
  endpoint: "https://registry.npmjs.org/phase3-test/latest", officialUrl: "https://registry.npmjs.org/phase3-test/1.2.3",
};

suite("release MongoDB integration", () => {
  const repository = new ReleaseRepository();
  const service = new ReleaseService(repository);

  beforeAll(async () => {
    await mongoose.connect(uri as string);
    await TechnologyModel.create({
      slug: technologySlug, name: "Phase 3 Fixture", category: "tooling", shortDescription: "Release integration fixture",
      overview: "A test-only technology record.", primaryUseCases: ["Integration testing"], whenToUse: ["Test fixture"], whenNotToUse: ["Production"],
      installation: "Not applicable", gettingStarted: "Not applicable", status: "published",
    });
    await repository.ensureSource(definition);
  });

  afterAll(async () => {
    await ReleaseModel.deleteMany({ slug: releaseSlug });
    await ReleaseSourceModel.deleteMany({ sourceKey });
    await TechnologyModel.deleteMany({ slug: technologySlug });
    await mongoose.disconnect();
  });

  it("upserts candidates idempotently, keeps them draft-only, and returns published content after review", async () => {
    const technologyId = await repository.findTechnologyId(technologySlug);
    expect(technologyId).not.toBeNull();
    const candidate = {
      sourceReleaseId: "1.2.3", version: "1.2.3", title: "Phase 3 Fixture 1.2.3", sourceTitle: "Fixture package 1.2.3",
      sourceUrl: "https://registry.npmjs.org/phase3-test/1.2.3", sourcePublishedAt: new Date("2026-10-19T00:00:00.000Z"), sourceExcerpt: "Upstream fixture text",
    };
    const first = await repository.insertCandidates(definition, technologyId, [candidate], new Date("2026-10-20T00:00:00.000Z"));
    const duplicate = await repository.insertCandidates(definition, technologyId, [candidate], new Date("2026-10-20T00:01:00.000Z"));
    expect(first).toBe(1);
    expect(duplicate).toBe(0);
    expect(await service.list({})).toMatchObject({ items: [], pagination: { totalItems: 0 } });
    await expect(service.get(releaseSlug)).rejects.toThrow("Release not found");

    const editorial = {
      summary: "An editor verified this release candidate against its official package source before publication.",
      whyItMatters: "The verified metadata helps readers identify the exact version and follow the source before planning an upgrade.",
      importantChanges: [{ title: "Verified release metadata", description: "The official registry lists this package version.", importance: "low" as const }],
      breakingChanges: [], migrationGuidance: "Check the official source and run your project tests before upgrading.",
      upgradeConsiderations: ["Confirm the version matches the package used by your application."], codeExamples: [],
    };
    expect(await repository.updateEditorialDecision(releaseSlug, "draft", "review", editorial)).toMatchObject({ status: "review" });
    expect(await repository.updateEditorialDecision(releaseSlug, "review", "published", editorial, "fixture-reviewer")).toMatchObject({ status: "published" });
    const publicRelease = await service.get(releaseSlug);
    expect(publicRelease.item).toMatchObject({ technologySlug, version: "1.2.3", sourceTitle: "Fixture package 1.2.3" });
    expect(publicRelease.item.lastVerifiedAt).toBeTruthy();
  });

  it("keeps the successful scan cutoff and ETag when a later check fails", async () => {
    const successfulAt = new Date("2026-10-19T10:00:00.000Z");
    const failedAt = new Date("2026-10-20T10:00:00.000Z");
    await repository.recordSourceCheck(sourceKey, successfulAt, '"fixture-etag"');
    await repository.recordSourceCheck(sourceKey, failedAt, '"ignored-etag"', "SOURCE_RATE_LIMITED");

    const source = await repository.findSourceState(sourceKey);
    expect(source?.lastCheckedAt?.toISOString()).toBe(failedAt.toISOString());
    expect(source?.lastSuccessfulAt?.toISOString()).toBe(successfulAt.toISOString());
    expect(source?.etag).toBe('"fixture-etag"');
    expect(source?.lastStatus).toBe("error");
  });
});
