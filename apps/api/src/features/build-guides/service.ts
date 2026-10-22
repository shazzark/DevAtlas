import { buildGuideDetailResponseSchema, buildGuideListQuerySchema, buildGuideListResponseSchema } from "@devatlas/shared";
import { BuildGuideRepository } from "./repository.js";

export class BuildGuideNotFoundError extends Error {
  constructor() { super("Build guide not found"); this.name = "BuildGuideNotFoundError"; }
}

export class BuildGuideService {
  constructor(private readonly repository = new BuildGuideRepository()) {}

  async list(rawQuery: unknown) {
    const query = buildGuideListQuerySchema.parse(rawQuery);
    return buildGuideListResponseSchema.parse(await this.repository.listPublished(query));
  }

  async get(slug: string) {
    const item = await this.repository.findPublishedBySlug(slug);
    if (!item) throw new BuildGuideNotFoundError();
    return buildGuideDetailResponseSchema.parse({ item });
  }
}
