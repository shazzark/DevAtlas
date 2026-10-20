import { describe, expect, it, vi } from "vitest";
import { ReleaseMonitorService } from "./monitor-service.js";
import type { ReleaseRepository } from "./repository.js";

function response(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

describe("release monitor service", () => {
  it("checks only configured automated sources and stores source findings as drafts", async () => {
    const inserted: number[] = [];
    const checked: string[] = [];
    const repository = {
      // A recent failed attempt must not hide releases published before that attempt.
      ensureSource: vi.fn(async (definition: { sourceKey: string; kind: string }) => ({ sourceKey: definition.sourceKey, enabled: true, lastCheckedAt: new Date("2026-10-20T00:00:00.000Z"), lastSuccessfulAt: null, etag: null })),
      findTechnologyId: vi.fn(async () => "technology-id"),
      insertCandidates: vi.fn(async (_definition: unknown, _technologyId: unknown, candidates: unknown[]) => { inserted.push(candidates.length); return candidates.length; }),
      recordSourceCheck: vi.fn(async (sourceKey: string) => { checked.push(sourceKey); }),
    };
    const fetcher = async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.hostname === "registry.npmjs.org") return response({ name: url.pathname.split("/")[1], version: "1.2.3", time: { "1.2.3": "2026-10-19T00:00:00.000Z" } });
      if (url.hostname === "nodejs.org") return response([{ version: "v24.0.0", date: "2026-10-19", lts: "Krypton" }]);
      if (url.hostname === "api.github.com") return response([{ id: 1, tag_name: "docker-v29.0.0", name: "Docker Engine", body: "Source notes", html_url: "https://github.com/moby/moby/releases/tag/docker-v29.0.0", draft: false, prerelease: false, published_at: "2026-10-19T00:00:00Z" }]);
      return response({}, 404);
    };
    const service = new ReleaseMonitorService(repository as unknown as ReleaseRepository, fetcher, () => new Date("2026-10-20T00:00:00.000Z"));
    const report = await service.run();

    expect(report).toMatchObject({ checkedSources: 8, failedSources: 0, discoveredCandidates: 8, newCandidates: 8, failures: [] });
    expect(repository.ensureSource).toHaveBeenCalledTimes(12);
    expect(checked).toHaveLength(8);
    expect(inserted.every((count) => count === 1)).toBe(true);
  });

  it("reports upstream rate limiting as failures and never counts it as a detected release", async () => {
    const repository = {
      ensureSource: vi.fn(async (definition: { sourceKey: string }) => ({ sourceKey: definition.sourceKey, enabled: true, lastCheckedAt: null, etag: null })),
      findTechnologyId: vi.fn(async () => "technology-id"),
      insertCandidates: vi.fn(async () => 0),
      recordSourceCheck: vi.fn(async () => undefined),
    };
    const service = new ReleaseMonitorService(repository as unknown as ReleaseRepository, async () => response({}, 429));
    const report = await service.run();
    expect(report.checkedSources).toBe(8);
    expect(report.failedSources).toBe(8);
    expect(report.newCandidates).toBe(0);
    expect(report.discoveredCandidates).toBe(0);
    expect(report.failures.every(({ code }) => code === "SOURCE_RATE_LIMITED")).toBe(true);
  });
});
