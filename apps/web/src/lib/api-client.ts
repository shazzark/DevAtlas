import "server-only";
import {
  healthResponseSchema, readinessResponseSchema, releaseDetailResponseSchema, releaseListResponseSchema, technologyDetailResponseSchema, technologyListResponseSchema,
  stackGuideDetailResponseSchema, stackGuideListResponseSchema,
  buildGuideDetailResponseSchema, buildGuideListResponseSchema,
  type HealthResponse, type ReadinessResponse, type TechnologyListQuery, type Technology,
  type ReleaseListQuery, type Release,
  type StackGuide, type StackGuideListQuery,
  type BuildGuide, type BuildGuideListQuery,
  searchResponseSchema, type SearchQuery,
} from "@devatlas/shared";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:4001";
const REQUEST_TIMEOUT_MS = 4_000;

export class ApiClientError extends Error {
  constructor(readonly status: number, readonly body: unknown) { super(`Backend request failed with status ${status}`); this.name = "ApiClientError"; }
}

function apiUrl(path: string): URL {
  const base = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
  const url = new URL(base);
  if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password || url.search || url.hash) {
    throw new Error("API_BASE_URL must be a plain HTTP or HTTPS origin");
  }
  const [pathname, search] = path.split("?", 2);
  url.pathname = `${url.pathname.replace(/\/$/, "")}${pathname}`;
  if (search) url.search = search;
  return url;
}

async function get<T>(path: string, parse: (body: unknown) => T): Promise<{ status: number; data: T }> {
  const response = await fetch(apiUrl(path), {
    method: "GET",
    cache: "no-store",
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body: unknown = await response.json();
  if (["/api/technologies", "/api/releases", "/api/stacks", "/api/builds", "/api/build-guides", "/api/search"].some((prefix) => path.startsWith(prefix)) && !response.ok) {
    throw new ApiClientError(response.status, body);
  }
  return { status: response.status, data: parse(body) };
}

export const apiClient = {
  getHealth(): Promise<{ status: number; data: HealthResponse }> {
    return get("/api/health", (body) => healthResponseSchema.parse(body));
  },
  getReadiness(): Promise<{ status: number; data: ReadinessResponse }> {
    return get("/api/health/ready", (body) => readinessResponseSchema.parse(body));
  },
  async listTechnologies(query: Partial<TechnologyListQuery> = {}) {
    const params = new URLSearchParams();
    for (const key of ["q", "category", "page", "limit"] as const) {
      const value = query[key];
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    return get(`/api/technologies${params.size ? `?${params}` : ""}`, (body) => technologyListResponseSchema.parse(body));
  },
  async getTechnology(slug: string): Promise<{ status: number; data: { item: Technology } }> {
    return get(`/api/technologies/${encodeURIComponent(slug)}`, (body) => technologyDetailResponseSchema.parse(body));
  },
  async listReleases(query: Partial<ReleaseListQuery> = {}) {
    const params = new URLSearchParams();
    for (const key of ["technologySlug", "page", "limit"] as const) {
      const value = query[key];
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    return get(`/api/releases${params.size ? `?${params}` : ""}`, (body) => releaseListResponseSchema.parse(body));
  },
  async getRelease(slug: string): Promise<{ status: number; data: { item: Release } }> {
    return get(`/api/releases/${encodeURIComponent(slug)}`, (body) => releaseDetailResponseSchema.parse(body));
  },
  async listStackGuides(query: Partial<StackGuideListQuery> = {}) {
    const params = new URLSearchParams();
    for (const key of ["q", "technologySlug", "page", "limit"] as const) {
      const value = query[key];
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    return get(`/api/stacks${params.size ? `?${params}` : ""}`, (body) => stackGuideListResponseSchema.parse(body));
  },
  async getStackGuide(slug: string): Promise<{ status: number; data: { item: StackGuide } }> {
    return get(`/api/stacks/${encodeURIComponent(slug)}`, (body) => stackGuideDetailResponseSchema.parse(body));
  },
  async listBuildGuides(query: Partial<BuildGuideListQuery> = {}) {
    const params = new URLSearchParams();
    for (const key of ["q", "technologySlug", "page", "limit"] as const) {
      const value = query[key];
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    return get(`/api/build-guides${params.size ? `?${params}` : ""}`, (body) => buildGuideListResponseSchema.parse(body));
  },
  async getBuildGuide(slug: string): Promise<{ status: number; data: { item: BuildGuide } }> {
    return get(`/api/build-guides/${encodeURIComponent(slug)}`, (body) => buildGuideDetailResponseSchema.parse(body));
  },
  async search(query: Partial<SearchQuery> = {}) {
    const params = new URLSearchParams();
    for (const key of ["q", "category", "technologySlug", "page", "limit"] as const) {
      const value = query[key];
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    return get(`/api/search${params.size ? `?${params}` : ""}`, (body) => searchResponseSchema.parse(body));
  },
};
