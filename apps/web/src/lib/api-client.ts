import "server-only";
import { healthResponseSchema, readinessResponseSchema, type HealthResponse, type ReadinessResponse } from "@devatlas/shared";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:4001";
const REQUEST_TIMEOUT_MS = 4_000;

function apiUrl(path: string): URL {
  const base = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
  const url = new URL(base);
  if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password || url.search || url.hash) {
    throw new Error("API_BASE_URL must be a plain HTTP or HTTPS origin");
  }
  url.pathname = `${url.pathname.replace(/\/$/, "")}${path}`;
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
  return { status: response.status, data: parse(body) };
}

export const apiClient = {
  getHealth(): Promise<{ status: number; data: HealthResponse }> {
    return get("/api/health", (body) => healthResponseSchema.parse(body));
  },
  getReadiness(): Promise<{ status: number; data: ReadinessResponse }> {
    return get("/api/health/ready", (body) => readinessResponseSchema.parse(body));
  },
};
