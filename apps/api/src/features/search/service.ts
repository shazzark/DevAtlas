import { searchQuerySchema, searchResponseSchema } from "@devatlas/shared";
import { SearchRepository } from "./repository.js";

export class SearchService {
  constructor(private readonly repository = new SearchRepository()) {}
  async search(rawQuery: unknown) {
    const query = searchQuerySchema.parse(rawQuery);
    return searchResponseSchema.parse(await this.repository.search(query));
  }
}
