import { z } from "zod";
import type { ReleaseSourceDefinition } from "./source-definitions.js";

const MAX_SOURCE_BYTES = 1_500_000;
const timeoutSignal = () => AbortSignal.timeout(8_000);

export type ReleaseCandidateInput = {
  sourceReleaseId: string;
  version: string;
  title: string;
  sourceTitle: string;
  sourceUrl: string;
  sourcePublishedAt: Date | null;
  sourceExcerpt: string | null;
};

export type SourceFetchResult = { candidates: ReleaseCandidateInput[]; etag: string | null; notModified: boolean };
export type SourceFetch = typeof fetch;

export class ReleaseSourceError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "ReleaseSourceError";
  }
}

const npmLatestSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  time: z.record(z.string(), z.string()).optional(),
}).passthrough();

const nodeReleaseSchema = z.object({ version: z.string(), date: z.string(), lts: z.union([z.string(), z.literal(false)]) }).passthrough();
const githubReleaseSchema = z.object({
  id: z.number().int().positive(),
  tag_name: z.string().min(1),
  name: z.string().nullable(),
  body: z.string().nullable(),
  html_url: z.string().url(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  published_at: z.string().datetime().nullable(),
}).passthrough();

async function boundedJson(response: Response): Promise<unknown> {
  const declaredSize = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_SOURCE_BYTES) throw new ReleaseSourceError("SOURCE_TOO_LARGE");
  if (!response.body) throw new ReleaseSourceError("SOURCE_EMPTY_BODY");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_SOURCE_BYTES) {
        await reader.cancel();
        throw new ReleaseSourceError("SOURCE_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown; }
  catch { throw new ReleaseSourceError("SOURCE_INVALID_JSON"); }
}

function assertOfficialEndpoint(definition: ReleaseSourceDefinition): URL {
  if (!definition.endpoint) throw new ReleaseSourceError("SOURCE_NOT_AUTOMATED");
  const url = new URL(definition.endpoint);
  const allowedHost = definition.kind === "npm-latest" ? url.hostname === "registry.npmjs.org"
    : definition.kind === "node-dist-index" ? url.hostname === "nodejs.org"
      : definition.kind === "github-releases" ? url.hostname === "api.github.com" : false;
  if (url.protocol !== "https:" || !allowedHost || url.username || url.password) throw new ReleaseSourceError("SOURCE_ENDPOINT_NOT_ALLOWED");
  return url;
}

async function requestJson(url: URL, kind: ReleaseSourceDefinition["kind"], etag: string | null, fetcher: SourceFetch) {
  const headers = new Headers({ accept: "application/json", "user-agent": "DevAtlas-Release-Monitor/1.0" });
  if (kind === "github-releases") headers.set("x-github-api-version", "2022-11-28");
  if (etag) headers.set("if-none-match", etag);
  let response: Response;
  try {
    response = await fetcher(url, { method: "GET", headers, redirect: "error", signal: timeoutSignal() });
  } catch { throw new ReleaseSourceError("SOURCE_NETWORK_ERROR"); }
  if (response.status === 304) return { body: undefined, etag: etag, notModified: true };
  if (!response.ok) throw new ReleaseSourceError(response.status === 429 ? "SOURCE_RATE_LIMITED" : `SOURCE_HTTP_${response.status}`);
  return { body: await boundedJson(response), etag: response.headers.get("etag"), notModified: false };
}

function dateOrNull(value: string | undefined | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function packageCandidate(definition: ReleaseSourceDefinition, raw: unknown): ReleaseCandidateInput[] {
  const parsed = npmLatestSchema.safeParse(raw);
  if (!parsed.success || !definition.endpoint) throw new ReleaseSourceError("SOURCE_SCHEMA_INVALID");
  const metadata = parsed.data;
  // The npm `latest` dist-tag can point to a prerelease, which must not become a normal release draft.
  if (metadata.version.includes("-")) return [];
  const base = new URL(definition.endpoint);
  const versionPath = `${base.pathname.replace(/\/latest$/, "")}/${encodeURIComponent(metadata.version)}`;
  return [{
    sourceReleaseId: metadata.version,
    version: metadata.version,
    title: `${definition.technologyName} ${metadata.version}`,
    sourceTitle: `${metadata.name} ${metadata.version} package metadata`,
    sourceUrl: `${base.origin}${versionPath}`,
    sourcePublishedAt: dateOrNull(metadata.time?.[metadata.version]),
    sourceExcerpt: metadata.description?.slice(0, 4_000) ?? null,
  }];
}

function nodeCandidates(raw: unknown, lastCheckedAt: Date | null): ReleaseCandidateInput[] {
  const parsed = z.array(nodeReleaseSchema).safeParse(raw);
  if (!parsed.success) throw new ReleaseSourceError("SOURCE_SCHEMA_INVALID");
  const stable = parsed.data.filter((entry) => /^v\d+\.\d+\.\d+$/.test(entry.version) && dateOrNull(entry.date));
  const selected = lastCheckedAt
    ? stable.filter((entry) => (dateOrNull(entry.date)?.valueOf() ?? 0) > lastCheckedAt.valueOf())
    : stable.slice(0, 1);
  return selected.slice(0, 50).map((entry) => ({
    sourceReleaseId: entry.version,
    version: entry.version,
    title: `Node.js ${entry.version}`,
    sourceTitle: `Node.js distribution index: ${entry.version}`,
    sourceUrl: "https://nodejs.org/dist/index.json",
    sourcePublishedAt: dateOrNull(entry.date),
    sourceExcerpt: entry.lts ? `Official index marks this release line as LTS: ${entry.lts}.` : null,
  }));
}

function githubCandidates(definition: ReleaseSourceDefinition, raw: unknown, lastCheckedAt: Date | null): ReleaseCandidateInput[] {
  const parsed = z.array(githubReleaseSchema).safeParse(raw);
  if (!parsed.success) throw new ReleaseSourceError("SOURCE_SCHEMA_INVALID");
  const dockerEngine = definition.sourceKey === "github:docker-engine";
  return parsed.data.filter((release) => {
    if (release.draft || release.prerelease) return false;
    if (dockerEngine && !/^docker-v\d+\.\d+\.\d+(?:[-+].*)?$/i.test(release.tag_name)) return false;
    const published = dateOrNull(release.published_at);
    return !lastCheckedAt || (published !== null && published.valueOf() > lastCheckedAt.valueOf());
  }).slice(0, 50).map((release) => {
    const version = dockerEngine ? release.tag_name.replace(/^docker-v/i, "") : release.tag_name;
    const sourceUrl = new URL(release.html_url);
    if (sourceUrl.protocol !== "https:" || sourceUrl.hostname !== "github.com") throw new ReleaseSourceError("SOURCE_LINK_NOT_OFFICIAL");
    return {
      sourceReleaseId: String(release.id), version,
      title: release.name?.trim() || `${definition.technologyName} ${version}`,
      sourceTitle: release.name?.trim() || release.tag_name,
      sourceUrl: sourceUrl.toString(),
      sourcePublishedAt: dateOrNull(release.published_at),
      sourceExcerpt: release.body?.slice(0, 20_000) ?? null,
    };
  });
}

export async function fetchReleaseCandidates(
  definition: ReleaseSourceDefinition,
  lastCheckedAt: Date | null,
  etag: string | null,
  fetcher: SourceFetch = fetch,
): Promise<{ candidates: ReleaseCandidateInput[]; etag: string | null; notModified: boolean }> {
  const url = assertOfficialEndpoint(definition);
  const response = await requestJson(url, definition.kind, etag, fetcher);
  if (response.notModified) return { candidates: [], etag: response.etag, notModified: true };
  const candidates = definition.kind === "npm-latest" ? packageCandidate(definition, response.body)
    : definition.kind === "node-dist-index" ? nodeCandidates(response.body, lastCheckedAt)
      : definition.kind === "github-releases" ? githubCandidates(definition, response.body, lastCheckedAt)
        : (() => { throw new ReleaseSourceError("SOURCE_NOT_AUTOMATED"); })();
  return { candidates, etag: response.etag, notModified: false };
}
