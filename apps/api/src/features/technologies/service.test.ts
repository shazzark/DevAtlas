import { describe, expect, it, vi } from "vitest";
import { TechnologyService } from "./service.js";

describe("TechnologyService", () => {
  it("applies default paging and validates category and query boundaries", async () => {
    const repository = { list: vi.fn(async () => ({ items: [], pagination: { page: 1, limit: 12, totalItems: 0, totalPages: 0 }, categories: [] })) };
    const service = new TechnologyService(repository as never);
    await service.list({ category: "database" });
    expect(repository.list).toHaveBeenCalledWith({ page: 1, limit: 12, category: "database" });
    await expect(service.list({ category: "unknown" })).rejects.toThrow();
    await expect(service.list({ limit: 1000 })).rejects.toThrow();
  });

  it("requires a public record for detail responses", async () => {
    const service = new TechnologyService({ findPublishedBySlug: vi.fn(async () => null) } as never);
    await expect(service.get("missing")).rejects.toMatchObject({ name: "TechnologyNotFoundError" });
  });
});
