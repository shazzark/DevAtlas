import { describe, expect, it, vi } from "vitest";
import { ReleaseService } from "./service.js";
import type { ReleaseRepository } from "./repository.js";

const content = {
  summary: "This release adds a source-backed improvement to the tested technology for project teams.",
  whyItMatters: "The change matters because it helps developers understand a verified behavior and plan a safer upgrade.",
  importantChanges: [{ title: "Improvement", description: "An official source documents the change.", importance: "medium" as const }],
  breakingChanges: [],
  migrationGuidance: "Review the linked official release notes and run the project test suite before upgrading.",
  upgradeConsiderations: ["Check compatibility with the versions used by your project."],
  codeExamples: [],
};

describe("release service", () => {
  it("validates query input and returns only the published response contract", async () => {
    const repository = { listPublished: vi.fn(async () => ({ items: [], pagination: { page: 1, limit: 12, totalItems: 0, totalPages: 0 } })) };
    const service = new ReleaseService(repository as unknown as ReleaseRepository);
    await expect(service.list({ page: "0" })).rejects.toThrow();
    expect(await service.list({})).toEqual({ items: [], pagination: { page: 1, limit: 12, totalItems: 0, totalPages: 0 } });
  });

  it("moves a candidate to review and publishes only after an explicit verified decision", async () => {
    const updateEditorialDecision = vi.fn(async (_slug: string, _expected: string, status: string) => ({ slug: "react-19-npm-react", status, lastVerifiedAt: status === "published" ? "2026-10-20T12:00:00.000Z" : null }));
    const repository = { findEditorialStatus: vi.fn().mockResolvedValueOnce("draft").mockResolvedValueOnce("review"), updateEditorialDecision };
    const service = new ReleaseService(repository as unknown as ReleaseRepository);
    const submitted = await service.review("react-19-npm-react", { decision: "submit_for_review", content }, "editor-1");
    expect(submitted.status).toBe("review");
    const published = await service.review("react-19-npm-react", { decision: "publish", content, verificationConfirmed: true }, "editor-1");
    expect(published).toMatchObject({ status: "published", lastVerifiedAt: "2026-10-20T12:00:00.000Z" });
    expect(updateEditorialDecision).toHaveBeenNthCalledWith(2, "react-19-npm-react", "review", "published", content, "editor-1");
  });

  it("prevents publication directly from draft and rejects unverified payloads", async () => {
    const repository = { findEditorialStatus: vi.fn().mockResolvedValue("draft"), updateEditorialDecision: vi.fn() };
    const service = new ReleaseService(repository as unknown as ReleaseRepository);
    await expect(service.review("react-19-npm-react", { decision: "publish", content, verificationConfirmed: true }, "editor-1")).rejects.toThrow("Only a reviewed item can be published");
    await expect(service.review("react-19-npm-react", { decision: "publish", content, verificationConfirmed: false }, "editor-1")).rejects.toThrow();
    expect(repository.updateEditorialDecision).not.toHaveBeenCalled();
  });
});
