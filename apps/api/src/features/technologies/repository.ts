import { TechnologyModel } from "./model.js";
import type { Technology, TechnologyListQuery } from "@devatlas/shared";

export type PublicTechnology = Technology;

function publicRecord(record: Record<string, unknown>): PublicTechnology {
  const { _id: _ignored, __v: _versionKey, status: _status, createdAt: _createdAt, updatedAt: _updatedAt, score: _score, ...safe } = record;
  const version = safe.version as { current?: string | null; releasedAt?: Date | string | null; sourceUrl?: string | null; lastVerifiedAt?: Date | string | null } | undefined;
  const iso = (value: Date | string | null | undefined) => value instanceof Date ? value.toISOString() : value ?? null;
  return {
    ...safe,
    keyConcepts: Array.isArray(safe.keyConcepts) ? (safe.keyConcepts as Record<string, unknown>[]).map(({ title, description }) => ({ title, description })) : [],
    codeExamples: Array.isArray(safe.codeExamples) ? (safe.codeExamples as Record<string, unknown>[]).map(({ title, language, code, explanation }) => ({ title, language, code, explanation })) : [],
    officialLinks: Array.isArray(safe.officialLinks) ? (safe.officialLinks as Record<string, unknown>[]).map(({ label, url }) => ({ label, url })) : [],
    version: {
      current: version?.current ?? null,
      releasedAt: iso(version?.releasedAt),
      sourceUrl: version?.sourceUrl ?? null,
      lastVerifiedAt: iso(version?.lastVerifiedAt),
    },
  } as PublicTechnology;
}

export class TechnologyRepository {
  async list(query: TechnologyListQuery) {
    const filter: Record<string, unknown> = { status: "published" };
    if (query.category) filter.category = query.category;
    if (query.q) filter.$text = { $search: query.q };
    let recordsQuery = TechnologyModel.find(filter);
    if (query.q) recordsQuery = recordsQuery.select({ score: { $meta: "textScore" } });
    const [records, totalItems, categories] = await Promise.all([
      recordsQuery.sort(query.q ? { score: { $meta: "textScore" }, name: 1, _id: 1 } : { name: 1, _id: 1 })
        .skip((query.page - 1) * query.limit).limit(query.limit).lean(),
      TechnologyModel.countDocuments(filter),
      TechnologyModel.distinct("category", { status: "published" }),
    ]);
    return {
      items: records.map((record) => publicRecord(record as unknown as Record<string, unknown>)),
      pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.ceil(totalItems / query.limit) },
      categories: categories.sort(),
    };
  }

  async findPublishedBySlug(slug: string) {
    const record = await TechnologyModel.findOne({ slug, status: "published" }).lean();
    return record ? publicRecord(record as unknown as Record<string, unknown>) : null;
  }
}
