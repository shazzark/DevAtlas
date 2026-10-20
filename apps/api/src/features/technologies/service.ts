import { technologyListQuerySchema, technologyListResponseSchema, technologyDetailResponseSchema } from "@devatlas/shared";
import { TechnologyRepository } from "./repository.js";

export class TechnologyNotFoundError extends Error {
  constructor() { super("Technology not found"); this.name = "TechnologyNotFoundError"; }
}

export class TechnologyService {
  constructor(private readonly repository = new TechnologyRepository()) {}

  async list(rawQuery: unknown) {
    const query = technologyListQuerySchema.parse(rawQuery);
    return technologyListResponseSchema.parse(await this.repository.list(query));
  }

  async get(slug: string) {
    const item = await this.repository.findPublishedBySlug(slug);
    if (!item) throw new TechnologyNotFoundError();
    return technologyDetailResponseSchema.parse({ item });
  }
}
