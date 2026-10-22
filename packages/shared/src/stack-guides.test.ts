import { describe, expect, it } from "vitest";
import { stackGuideListQuerySchema, stackGuideSchema } from "./stack-guides.js";

describe("stack guide contracts", () => {
  it("validates bounded search and pagination inputs", () => {
    expect(stackGuideListQuerySchema.parse({ q: "  node  ", page: "2", limit: "12" })).toEqual({ q: "node", page: 2, limit: 12 });
    expect(stackGuideListQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(stackGuideListQuerySchema.safeParse({ unexpected: "value" }).success).toBe(false);
  });

  it("requires related technologies, tutorial sections and traceable references", () => {
    const guide = {
      slug: "node-express-postgresql",
      title: "Build an API",
      summary: "Connect an API to a relational database.",
      technologies: [{ slug: "nodejs", name: "Node.js" }, { slug: "express", name: "Express" }],
      prerequisites: ["A supported Node.js installation"],
      compatibility: ["Use versions supported by each official project."],
      architecture: "Express handles HTTP requests while PostgreSQL stores records.",
      steps: [{ title: "Start a server", explanation: "Register a route.", code: { title: "server.mjs", language: "javascript", code: "const value = 1;", explanation: "A JavaScript example." } }],
      troubleshooting: [{ problem: "Port unavailable", solution: "Choose a free port." }],
      references: [{ label: "Official guide", url: "https://example.com/docs" }],
      lastVerifiedAt: "2026-10-22T00:00:00.000Z",
    };
    expect(stackGuideSchema.parse(guide)).toEqual(guide);
    expect(stackGuideSchema.safeParse({ ...guide, technologies: [guide.technologies[0]] }).success).toBe(false);
    expect(stackGuideSchema.safeParse({ ...guide, references: [] }).success).toBe(false);
  });
});
