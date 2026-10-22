import type { ReleaseListQuery, ReleaseEditorialContent } from "@devatlas/shared";
import { TechnologyModel } from "../technologies/model.js";
import { ReleaseModel, ReleaseSourceModel } from "./models.js";
import type { ReleaseCandidateInput } from "./source-adapters.js";
import type { ReleaseSourceDefinition } from "./source-definitions.js";

function toIso(value: Date | null | undefined): string | null {
  return value instanceof Date ? value.toISOString() : null;
}

function publicRelease(record: Record<string, unknown>) {
  const changes = Array.isArray(record.importantChanges) ? record.importantChanges as Record<string, unknown>[] : [];
  const examples = Array.isArray(record.codeExamples) ? record.codeExamples as Record<string, unknown>[] : [];
  return {
    slug: record.slug,
    technologySlug: record.technologySlug,
    technologyName: record.technologyName,
    version: record.version,
    title: record.title,
    summary: record.summary,
    whyItMatters: record.whyItMatters,
    importantChanges: changes.map(({ title, description, importance }) => ({ title, description, importance })),
    breakingChanges: record.breakingChanges ?? [],
    migrationGuidance: record.migrationGuidance,
    upgradeConsiderations: record.upgradeConsiderations ?? [],
    codeExamples: examples.map(({ title, language, code, explanation }) => ({ title, language, code, explanation })),
    sourceUrl: record.sourceUrl,
    sourceTitle: record.sourceTitle,
    sourcePublishedAt: toIso(record.sourcePublishedAt as Date | null),
    lastVerifiedAt: toIso(record.lastVerifiedAt as Date | null),
  };
}

function candidateView(record: Record<string, unknown>) {
  return {
    slug: record.slug,
    technologySlug: record.technologySlug,
    technologyName: record.technologyName,
    version: record.version,
    title: record.title,
    sourceUrl: record.sourceUrl,
    sourceTitle: record.sourceTitle,
    sourceExcerpt: record.sourceExcerpt ?? null,
    sourcePublishedAt: toIso(record.sourcePublishedAt as Date | null),
    lastDetectedAt: toIso(record.lastDetectedAt as Date),
    status: record.status,
  };
}

export class ReleaseRepository {
  async findTechnologyId(technologySlug: string) {
    const technology = await TechnologyModel.findOne({ slug: technologySlug }).select({ _id: 1 }).lean();
    return technology?._id ?? null;
  }

  async listPublished(query: ReleaseListQuery) {
    const filter: Record<string, unknown> = { status: "published" };
    if (query.technologySlug) filter.technologySlug = query.technologySlug;
    const [records, totalItems] = await Promise.all([
      ReleaseModel.find(filter).sort({ sourcePublishedAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
      ReleaseModel.countDocuments(filter),
    ]);
    return {
      items: records.map((record) => publicRelease(record as unknown as Record<string, unknown>)),
      pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.ceil(totalItems / query.limit) },
    };
  }

  async findPublishedBySlug(slug: string) {
    const record = await ReleaseModel.findOne({ slug, status: "published" }).lean();
    return record ? publicRelease(record as unknown as Record<string, unknown>) : null;
  }

  async findEditorialStatus(slug: string) {
    const record = await ReleaseModel.findOne({ slug }).select({ status: 1 }).lean();
    return record?.status as "draft" | "review" | "published" | undefined;
  }

  async listCandidates() {
    const records = await ReleaseModel.find({ status: { $in: ["draft", "review"] } }).sort({ lastDetectedAt: -1, _id: -1 }).limit(100).lean();
    return records.map((record) => candidateView(record as unknown as Record<string, unknown>));
  }

  async ensureSource(definition: ReleaseSourceDefinition) {
    const technology = await TechnologyModel.findOne({ slug: definition.technologySlug }).select({ name: 1 }).lean();
    if (!technology) throw new Error(`Technology source is not configured: ${definition.technologySlug}`);
    await ReleaseSourceModel.updateOne({ sourceKey: definition.sourceKey }, { $setOnInsert: {
      ...definition,
      technologyName: technology.name,
      enabled: true,
      lastStatus: definition.kind === "manual" ? "manual" : "unchecked",
    } }, { upsert: true, runValidators: true });
    const source = await ReleaseSourceModel.findOne({ sourceKey: definition.sourceKey }).lean();
    if (!source) throw new Error("Release source configuration could not be loaded");
    return source;
  }

  async recordSourceCheck(sourceKey: string, checkedAt: Date, etag: string | null, errorCode?: string) {
    await ReleaseSourceModel.updateOne({ sourceKey }, { $set: {
      lastCheckedAt: checkedAt,
      lastStatus: errorCode ? "error" : "ok",
      lastErrorCode: errorCode ?? null,
      ...(errorCode ? {} : { etag, lastSuccessfulAt: checkedAt }),
    } });
  }

  async insertCandidates(
    definition: ReleaseSourceDefinition,
    technologyId: unknown,
    candidates: ReleaseCandidateInput[],
    detectedAt: Date,
  ) {
    if (!candidates.length) return 0;
    const operations = candidates.map((candidate) => {
      const versionSlug = candidate.version.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const sourceSlug = definition.sourceKey.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      return {
        updateOne: {
          filter: { sourceKey: definition.sourceKey, sourceReleaseId: candidate.sourceReleaseId },
          update: {
            $set: { lastDetectedAt: detectedAt },
            $setOnInsert: {
              slug: `${definition.technologySlug}-${versionSlug}-${sourceSlug}`,
              technologyId,
              technologySlug: definition.technologySlug,
              technologyName: definition.technologyName,
              sourceKey: definition.sourceKey,
              ...candidate,
              status: "draft",
            },
          },
          upsert: true,
        },
      };
    });
    const result = await ReleaseModel.bulkWrite(operations, { ordered: false });
    return result.upsertedCount;
  }

  async findSourceState(sourceKey: string) {
    return ReleaseSourceModel.findOne({ sourceKey }).lean();
  }

  async updateEditorialDecision(slug: string, expectedStatus: "draft" | "review", nextStatus: "draft" | "review" | "published", content: ReleaseEditorialContent | undefined, actorId?: string) {
    const set: Record<string, unknown> = { status: nextStatus };
    if (content) Object.assign(set, content);
    if (nextStatus === "published") {
      set.lastVerifiedAt = new Date();
      set.reviewedAt = new Date();
      set.reviewedBy = actorId;
      set.publishedAt = new Date();
    }
    const result = await ReleaseModel.findOneAndUpdate({ slug, status: expectedStatus }, { $set: set }, { returnDocument: "after", runValidators: true }).lean();
    return result ? { slug: result.slug, status: result.status, lastVerifiedAt: toIso(result.lastVerifiedAt as Date | null) } : null;
  }
}
