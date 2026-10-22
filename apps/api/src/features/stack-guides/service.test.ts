import { describe, expect, it, vi } from "vitest";
import { StackGuideService } from "./service.js";

const guide = {
  slug: "react-typescript-ui",
  title: "Build a typed React interface",
  summary: "Use TypeScript contracts in React components.",
  technologies: [{ slug: "react", name: "React" }, { slug: "typescript", name: "TypeScript" }],
  prerequisites: ["Basic JavaScript"],
  compatibility: ["Use versions supported by the official installation guides."],
  architecture: "React renders the view; TypeScript checks the component contracts before runtime.",
  steps: [{ title: "Type a component", explanation: "Describe the props as a small interface.", code: { title: "Component props", language: "tsx", code: "type Props = { label: string };", explanation: "The type makes the required input explicit." } }],
  troubleshooting: [{ problem: "JSX types are missing", solution: "Check the React type package and JSX compiler setting." }],
  references: [{ label: "React with TypeScript", url: "https://react.dev/learn/typescript" }],
  lastVerifiedAt: "2026-10-22T00:00:00.000Z",
};

describe("StackGuideService", () => {
  it("validates query defaults and response contracts", async () => {
    const repository = { listPublished: vi.fn(async () => ({ items: [guide], pagination: { page: 1, limit: 12, totalItems: 1, totalPages: 1 } })) };
    const service = new StackGuideService(repository as never);
    const result = await service.list({ technologySlug: "react" });
    expect(repository.listPublished).toHaveBeenCalledWith({ page: 1, limit: 12, technologySlug: "react" });
    expect(result.items[0]?.technologies).toHaveLength(2);
    await expect(service.list({ page: 0 })).rejects.toThrow();
  });

  it("rejects details that are absent from the public repository", async () => {
    const service = new StackGuideService({ findPublishedBySlug: vi.fn(async () => null) } as never);
    await expect(service.get("unpublished-guide")).rejects.toMatchObject({ name: "StackGuideNotFoundError" });
  });
});
