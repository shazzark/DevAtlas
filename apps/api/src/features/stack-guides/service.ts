import { stackGuideDetailResponseSchema, stackGuideListQuerySchema, stackGuideListResponseSchema } from "@devatlas/shared";
import { StackGuideRepository } from "./repository.js";

export class StackGuideNotFoundError extends Error {
  constructor() { super("Stack guide not found"); this.name = "StackGuideNotFoundError"; }
}

export class StackGuideService {
  constructor(private readonly repository = new StackGuideRepository()) {}

  async list(rawQuery: unknown) {
    const query = stackGuideListQuerySchema.parse(rawQuery);
    return stackGuideListResponseSchema.parse(await this.repository.listPublished(query));
  }

  async get(slug: string) {
    const item = await this.repository.findPublishedBySlug(slug);
    if (!item) throw new StackGuideNotFoundError();
    return stackGuideDetailResponseSchema.parse({ item });
  }
}
