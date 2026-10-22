import type { SearchCategory, SearchQuery, SearchResult } from "@devatlas/shared";
import type { Model } from "mongoose";
import { TechnologyModel } from "../technologies/model.js";
import { ReleaseModel } from "../releases/models.js";
import { StackGuideModel } from "../stack-guides/model.js";
import { BuildGuideModel } from "../build-guides/model.js";

type SearchRecord = { slug: string; title?: string; name?: string; summary?: string; shortDescription?: string; technologySlug?: string; technologySlugs?: string[]; sourceExcerpt?: string; version?: string };

function toResult(category: SearchCategory, record: SearchRecord): SearchResult {
  const slug = record.slug;
  const technologySlugs = record.technologySlugs ?? (record.technologySlug ? [record.technologySlug] : category === "technology" ? [slug] : []);
  return {
    category,
    title: record.title ?? record.name ?? slug,
    slug,
    summary: record.summary ?? record.shortDescription ?? (category === "release" ? `Release ${record.version ?? ""} ${record.sourceExcerpt ?? ""}`.trim() : ""),
    href: category === "technology" ? `/tools/${slug}` : category === "release" ? `/releases/${slug}` : category === "stack" ? `/stacks/${slug}` : `/builds/${slug}`,
    technologySlugs,
  };
}

export class SearchRepository {
  async search(query: SearchQuery) {
    const publishedTechnologySlugs = new Set(await TechnologyModel.distinct("slug", { status: "published" }));
    const categories: SearchCategory[] = query.category ? [query.category] : ["technology", "release", "stack", "build"];
    const specs: { category: SearchCategory; model: Model<any>; status: Record<string, unknown>; fields: Record<string, number>; techField: string }[] = [
      { category: "technology" as const, model: TechnologyModel, status: { status: "published" }, fields: { slug: 1, name: 1, shortDescription: 1, overview: 1 }, techField: "slug" },
      { category: "release" as const, model: ReleaseModel, status: { status: "published", lastVerifiedAt: { $ne: null } }, fields: { slug: 1, title: 1, summary: 1, sourceExcerpt: 1, version: 1, technologySlug: 1 }, techField: "technologySlug" },
      { category: "stack" as const, model: StackGuideModel, status: { status: "published", lastVerifiedAt: { $ne: null } }, fields: { slug: 1, title: 1, summary: 1, technologySlugs: 1 }, techField: "technologySlugs" },
      { category: "build" as const, model: BuildGuideModel, status: { status: "published", lastVerifiedAt: { $ne: null } }, fields: { slug: 1, title: 1, summary: 1, technologySlugs: 1 }, techField: "technologySlugs" },
    ];
    const results = await Promise.all(specs.filter((spec) => categories.includes(spec.category)).map(async (spec) => {
      const filter: Record<string, unknown> = { ...spec.status };
      if (query.q) filter.$text = { $search: query.q };
      if (query.technologySlug) filter[spec.techField] = query.technologySlug;
      const projection = { ...spec.fields, ...(query.q ? { score: { $meta: "textScore" } } : {}) };
      const [records, total] = await Promise.all([
        spec.model.find(filter).select(projection).sort(query.q ? { score: { $meta: "textScore" }, _id: 1 } : { title: 1, name: 1, _id: 1 }).limit(300).lean(),
        spec.model.countDocuments(filter),
      ]);
      const visibleRecords = records.filter((record) => {
        const raw = record as unknown as SearchRecord;
        if (spec.category === "release") return Boolean(raw.technologySlug && publishedTechnologySlugs.has(raw.technologySlug));
        if (spec.category === "stack" || spec.category === "build") return Boolean(raw.technologySlugs?.length && raw.technologySlugs.every((slug) => publishedTechnologySlugs.has(slug)));
        return true;
      });
      return {
        items: visibleRecords.map((record) => ({
          item: toResult(spec.category, record as unknown as SearchRecord),
          score: typeof (record as { score?: unknown }).score === "number" ? (record as { score: number }).score : 0,
        })),
        total: spec.category === "stack" || spec.category === "build" || spec.category === "release" ? visibleRecords.length : total,
      };
    }));
    const combined = results.flatMap((result) => result.items).sort((left, right) =>
      query.q ? right.score - left.score || left.item.title.localeCompare(right.item.title) : left.item.title.localeCompare(right.item.title),
    );
    const totalItems = results.reduce((sum, result) => sum + result.total, 0);
    const items = combined.slice((query.page - 1) * query.limit, query.page * query.limit).map(({ item }) => item);

    const seedSlugs = [...new Set(items.flatMap((item) => item.technologySlugs))];
    let related: SearchResult[] = [];
    if (seedSlugs.length) {
      const relatedSpecs = specs;
      const groups = await Promise.all(relatedSpecs.map(async (spec) => {
        const filter: Record<string, unknown> = { ...spec.status, [spec.techField]: { $in: seedSlugs } };
        if (spec.category === "release") filter.technologySlug = { $in: seedSlugs.filter((slug) => publishedTechnologySlugs.has(slug)) };
        if (spec.category === "stack" || spec.category === "build") filter.technologySlugs = { $in: seedSlugs, $not: { $elemMatch: { $nin: [...publishedTechnologySlugs] } } };
        if (query.q) filter.$text = { $search: query.q };
        return spec.model.find(filter).select(spec.fields).sort({ updatedAt: -1, _id: 1 }).limit(4).lean().then((records) => records.map((record) => toResult(spec.category, record as unknown as SearchRecord)));
      }));
      const seen = new Set(items.map((item) => `${item.category}:${item.slug}`));
      related = groups.flat().filter((item) => !seen.has(`${item.category}:${item.slug}`)).slice(0, 4);
    }
    return { items, related, pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.ceil(totalItems / query.limit) } };
  }
}
