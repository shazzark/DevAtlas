import { describe, expect, it, vi } from "vitest";
import { fetchReleaseCandidates, ReleaseSourceError } from "./source-adapters.js";
import type { ReleaseSourceDefinition } from "./source-definitions.js";

function response(value: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json", ...headers } });
}

describe("official release source adapters", () => {
  it("converts npm registry metadata into a traceable candidate without editorial claims", async () => {
    const definition: ReleaseSourceDefinition = {
      sourceKey: "npm:vitest", technologySlug: "vitest", technologyName: "Vitest", kind: "npm-latest",
      endpoint: "https://registry.npmjs.org/vitest/latest", officialUrl: "https://github.com/vitest-dev/vitest/releases",
    };
    const fetcher = vi.fn(async () => response({ name: "vitest", version: "3.2.4", description: "A test runner", time: { "3.2.4": "2026-01-02T03:04:05.000Z" } }, 200, { etag: "registry-v1" }));
    const result = await fetchReleaseCandidates(definition, null, null, fetcher);
    expect(result.candidates).toMatchObject([{ version: "3.2.4", sourceTitle: "vitest 3.2.4 package metadata", sourcePublishedAt: new Date("2026-01-02T03:04:05.000Z") }]);
    expect(result.candidates[0]?.sourceUrl).toBe("https://registry.npmjs.org/vitest/3.2.4");
    expect(result.etag).toBe("registry-v1");
  });

  it("does not report npm prereleases as stable candidates", async () => {
    const definition: ReleaseSourceDefinition = {
      sourceKey: "npm:next", technologySlug: "nextjs", technologyName: "Next.js", kind: "npm-latest",
      endpoint: "https://registry.npmjs.org/next/latest", officialUrl: "https://github.com/vercel/next.js/releases",
    };
    const result = await fetchReleaseCandidates(definition, null, null, async () => response({ name: "next", version: "16.0.0-canary.1" }));
    expect(result.candidates).toEqual([]);
  });

  it("extracts only stable Node.js versions newer than the last successful check", async () => {
    const definition: ReleaseSourceDefinition = {
      sourceKey: "nodejs:dist-index", technologySlug: "nodejs", technologyName: "Node.js", kind: "node-dist-index",
      endpoint: "https://nodejs.org/dist/index.json", officialUrl: "https://nodejs.org/en/about/previous-releases",
    };
    const feed = [
      { version: "v24.1.0", date: "2026-03-01", lts: "Krypton" },
      { version: "v25.0.0-rc.1", date: "2026-02-20", lts: false },
      { version: "v22.4.0", date: "2025-12-30", lts: "Jod" },
    ];
    const result = await fetchReleaseCandidates(definition, new Date("2026-02-28T00:00:00.000Z"), null, async () => response(feed));
    expect(result.candidates.map(({ version }) => version)).toEqual(["v24.1.0"]);
  });

  it("filters GitHub drafts, prereleases and unrelated Moby tags", async () => {
    const definition: ReleaseSourceDefinition = {
      sourceKey: "github:docker-engine", technologySlug: "docker", technologyName: "Docker", kind: "github-releases",
      endpoint: "https://api.github.com/repos/moby/moby/releases?per_page=30", officialUrl: "https://github.com/moby/moby/releases",
    };
    const feed = [
      { id: 1, tag_name: "docker-v29.0.0", name: "Docker Engine 29", body: "Release notes", html_url: "https://github.com/moby/moby/releases/tag/docker-v29.0.0", draft: false, prerelease: false, published_at: "2026-04-01T00:00:00Z" },
      { id: 2, tag_name: "docker-v30.0.0-rc.1", name: "Preview", body: null, html_url: "https://github.com/moby/moby/releases/tag/docker-v30.0.0-rc.1", draft: false, prerelease: true, published_at: "2026-04-02T00:00:00Z" },
      { id: 3, tag_name: "containerd-v3.0.0", name: "Unrelated project", body: null, html_url: "https://github.com/moby/moby/releases/tag/containerd-v3.0.0", draft: false, prerelease: false, published_at: "2026-04-02T00:00:00Z" },
    ];
    const result = await fetchReleaseCandidates(definition, null, null, async () => response(feed));
    expect(result.candidates.map(({ version }) => version)).toEqual(["29.0.0"]);
  });

  it("treats a 304 response as unchanged rather than as an empty release detection", async () => {
    const definition: ReleaseSourceDefinition = {
      sourceKey: "npm:react", technologySlug: "react", technologyName: "React", kind: "npm-latest",
      endpoint: "https://registry.npmjs.org/react/latest", officialUrl: "https://github.com/facebook/react/releases",
    };
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(null, { status: 304 }));
    const result = await fetchReleaseCandidates(definition, null, "previous-tag", fetcher);
    expect(result).toEqual({ candidates: [], etag: "previous-tag", notModified: true });
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ redirect: "error" });
  });

  it("rejects unapproved endpoints and source errors with safe codes", async () => {
    const definition: ReleaseSourceDefinition = {
      sourceKey: "npm:fake", technologySlug: "react", technologyName: "React", kind: "npm-latest",
      endpoint: "https://attacker.invalid/package/latest", officialUrl: "https://github.com/facebook/react/releases",
    };
    await expect(fetchReleaseCandidates(definition, null, null)).rejects.toMatchObject({ code: "SOURCE_ENDPOINT_NOT_ALLOWED" } satisfies Partial<ReleaseSourceError>);
  });

  it("refuses oversized source responses before parsing their content", async () => {
    const definition: ReleaseSourceDefinition = {
      sourceKey: "npm:react", technologySlug: "react", technologyName: "React", kind: "npm-latest",
      endpoint: "https://registry.npmjs.org/react/latest", officialUrl: "https://github.com/facebook/react/releases",
    };
    await expect(fetchReleaseCandidates(definition, null, null, async () => response({}, 200, { "content-length": "2000000" })))
      .rejects.toMatchObject({ code: "SOURCE_TOO_LARGE" });
  });
});
