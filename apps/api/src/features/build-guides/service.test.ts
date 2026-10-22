import { describe, expect, it, vi } from "vitest";
import { BuildGuideService } from "./service.js";

const guide = {
  slug: "rest-task-api", title: "REST Task API", summary: "Build a small task API.",
  learningObjectives: ["Create HTTP routes", "Persist task records"], prerequisites: ["Node.js", "HTTP basics"],
  technologies: [{ slug: "nodejs", name: "Node.js" }, { slug: "express", name: "Express" }],
  architecture: "An Express API reads and writes PostgreSQL records.",
  steps: [{ title: "Create a route", objective: "Respond to a request", explanation: "Map a method and path to a handler.", decision: "Keep transport logic at the HTTP boundary.", examples: [{ title: "Health route", language: "javascript", code: "app.get('/health', (_req, res) => res.json({ status: 'ok' }));", explanation: "A small GET route exposes the process status." }] }],
  testingInstructions: [{ title: "Run tests", command: "npm test", expectedResult: "The task route tests pass." }],
  commonErrors: [{ problem: "The database is unavailable", cause: "The connection environment is missing.", solution: "Set the database connection before starting the API." }],
  outcome: "A small API that stores and returns tasks.", references: [{ label: "Express", url: "https://expressjs.com/en/5x/starter/hello-world/" }],
  lastVerifiedAt: "2026-10-22T00:00:00.000Z",
};

describe("BuildGuideService", () => {
  it("validates filters, applies defaults, and validates list results", async () => {
    const repository = { listPublished: vi.fn(async () => ({ items: [guide], pagination: { page: 1, limit: 12, totalItems: 1, totalPages: 1 } })) };
    const service = new BuildGuideService(repository as never);
    const result = await service.list({ technologySlug: "nodejs" });
    expect(repository.listPublished).toHaveBeenCalledWith({ page: 1, limit: 12, technologySlug: "nodejs" });
    expect(result.items[0]?.steps[0]?.examples).toHaveLength(1);
    await expect(service.list({ limit: 1000 })).rejects.toThrow();
  });

  it("requires a public guide for detail responses", async () => {
    const service = new BuildGuideService({ findPublishedBySlug: vi.fn(async () => null) } as never);
    await expect(service.get("unpublished-guide")).rejects.toMatchObject({ name: "BuildGuideNotFoundError" });
  });
});
