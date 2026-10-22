import type { BuildGuideListQuery } from "@devatlas/shared";
import { TechnologyModel } from "../technologies/model.js";
import { BuildGuideModel } from "./model.js";

function isoDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function publicGuide(record: Record<string, unknown>, technologies: { slug: string; name: string }[]) {
  const slugs = record.technologySlugs as string[];
  const bySlug = new Map(technologies.map((technology) => [technology.slug, technology.name]));
  return {
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    learningObjectives: record.learningObjectives,
    prerequisites: record.prerequisites,
    technologies: slugs.map((slug) => ({ slug, name: bySlug.get(slug)! })),
    architecture: record.architecture,
    steps: (record.steps as Record<string, unknown>[]).map((step) => ({
      title: step.title,
      objective: step.objective,
      explanation: step.explanation,
      decision: step.decision,
      examples: (step.examples as Record<string, unknown>[]).map(({ title, language, code, explanation }) => ({ title, language, code, explanation })),
    })),
    testingInstructions: (record.testingInstructions as Record<string, unknown>[]).map(({ title, command, expectedResult }) => ({ title, command, expectedResult })),
    commonErrors: (record.commonErrors as Record<string, unknown>[]).map(({ problem, cause, solution }) => ({ problem, cause, solution })),
    references: (record.references as Record<string, unknown>[]).map(({ label, url }) => ({ label, url })),
    outcome: record.outcome,
    lastVerifiedAt: isoDate(record.lastVerifiedAt as Date | string),
  };
}

export class BuildGuideRepository {
  async listPublished(query: BuildGuideListQuery) {
    const filter: Record<string, unknown> = { status: "published" };
    if (query.technologySlug) filter.technologySlugs = query.technologySlug;
    if (query.q) filter.$text = { $search: query.q };
    const [result] = await BuildGuideModel.aggregate([
      { $match: filter },
      { $lookup: {
        from: TechnologyModel.collection.name,
        let: { guideSlugs: "$technologySlugs" },
        pipeline: [
          { $match: { status: "published", $expr: { $in: ["$slug", "$$guideSlugs"] } } },
          { $project: { _id: 0, slug: 1, name: 1 } },
        ],
        as: "resolvedTechnologies",
      } },
      { $match: { $expr: { $and: [
        { $gte: [{ $size: "$technologySlugs" }, 2] },
        { $eq: [{ $size: "$technologySlugs" }, { $size: "$resolvedTechnologies" }] },
      ] } } },
      { $facet: {
        items: [
          { $sort: query.q ? { score: { $meta: "textScore" }, title: 1, _id: 1 } : { title: 1, _id: 1 } },
          { $skip: (query.page - 1) * query.limit },
          { $limit: query.limit },
        ],
        pagination: [{ $count: "totalItems" }],
      } },
    ]);
    const records = (result?.items ?? []) as Record<string, unknown>[];
    const items = records.map((record) => {
      const technologies = record.resolvedTechnologies as { slug: string; name: string }[];
      const { _id: _ignored, __v: _versionKey, status: _status, createdAt: _createdAt, updatedAt: _updatedAt, score: _score,
        resolvedTechnologies: _joined, ...safe } = record;
      return publicGuide(safe, technologies);
    });
    const totalItems = Number((result?.pagination?.[0] as { totalItems?: number } | undefined)?.totalItems ?? 0);
    return { items, pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.ceil(totalItems / query.limit) } };
  }

  async findPublishedBySlug(slug: string) {
    const record = await BuildGuideModel.findOne({ slug, status: "published" }).lean();
    if (!record) return null;
    const slugs = record.technologySlugs;
    const technologies = await TechnologyModel.find({ slug: { $in: slugs }, status: "published" }).select({ slug: 1, name: 1, _id: 0 }).lean();
    if (technologies.length !== slugs.length) return null;
    return publicGuide(record as unknown as Record<string, unknown>, technologies);
  }
}
