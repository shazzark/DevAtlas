import { describe, expect, it } from "vitest";
import { buildGuideListQuerySchema, buildGuideSchema } from "./build-guides.js";

const guide = {
  slug: "rest-task-api",
  title: "Build a REST task API",
  summary: "Create a JSON API that stores tasks in PostgreSQL.",
  learningObjectives: ["Create a route", "Use parameterized SQL"],
  prerequisites: ["Basic JavaScript and SQL"],
  technologies: [{ slug: "nodejs", name: "Node.js" }, { slug: "express", name: "Express" }],
  architecture: "Express maps HTTP requests to parameterized PostgreSQL queries.",
  steps: [{ title: "Create the server", objective: "Serve a health response.", explanation: "Register an Express route.", decision: "Keep the example small before adding persistence.", examples: [{ title: "server.mjs", language: "javascript", code: "const value = 1;", explanation: "A valid example." }] }],
  testingInstructions: [{ title: "Run API tests", command: "npm test", expectedResult: "All tests pass." }],
  commonErrors: [{ problem: "Database unavailable", cause: "The server cannot reach PostgreSQL.", solution: "Check the connection string and service status." }],
  outcome: "A task API returns and stores task records.",
  references: [{ label: "Official docs", url: "https://example.com/docs" }],
  lastVerifiedAt: "2026-10-22T00:00:00.000Z",
};

describe("build guide contracts", () => {
  it("validates bounded search and pagination inputs", () => {
    expect(buildGuideListQuerySchema.parse({ q: " tasks ", page: "2", limit: "12" })).toEqual({ q: "tasks", page: 2, limit: 12 });
    expect(buildGuideListQuerySchema.safeParse({ technologySlug: "bad slug" }).success).toBe(false);
    expect(buildGuideListQuerySchema.safeParse({ unexpected: true }).success).toBe(false);
  });

  it("requires project objectives, implementation, tests, errors, outcome, and references", () => {
    expect(buildGuideSchema.parse(guide)).toEqual(guide);
    expect(buildGuideSchema.safeParse({ ...guide, testingInstructions: [] }).success).toBe(false);
    expect(buildGuideSchema.safeParse({ ...guide, technologies: [] }).success).toBe(false);
  });
});
