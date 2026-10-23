import { NextResponse } from "next/server";
import { createAdminApiToken } from "@/lib/admin-api-token";

type Context = { params: Promise<{ path: string[] }> };
const apiBaseUrl = (process.env.API_BASE_URL ?? "http://127.0.0.1:4001").replace(/\/$/, "");
const ADMIN_REQUEST_TIMEOUT_MS = 8_000;

export const maxDuration = 10;

async function proxy(request: Request, context: Context) {
  if (request.method !== "GET" && request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: { code: "INVALID_ORIGIN", message: "Admin request origin is invalid" } }, { status: 403 });
  }
  const token = await createAdminApiToken();
  if (!token) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Admin access is required" } }, { status: 401 });
  const { path } = await context.params;
  const safePath = path.map((part) => encodeURIComponent(part)).join("/");
  let body: string | undefined;
  if (request.method !== "GET") {
    if (Number(request.headers.get("content-length") ?? 0) > 1_048_576) return NextResponse.json({ error: { code: "BODY_TOO_LARGE", message: "Admin request is too large" } }, { status: 413 });
    body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 1_048_576) return NextResponse.json({ error: { code: "BODY_TOO_LARGE", message: "Admin request is too large" } }, { status: 413 });
  }
  try {
    const upstream = await fetch(`${apiBaseUrl}/api/admin/${safePath}${new URL(request.url).search}`, {
      method: request.method,
      headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
      body,
      cache: "no-store",
      // Leave time for request parsing and the safe 503 response within Vercel Hobby's default budget.
      signal: AbortSignal.timeout(ADMIN_REQUEST_TIMEOUT_MS),
    });
    const payload: unknown = await upstream.json();
    return NextResponse.json(payload, { status: upstream.status, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: { code: "ADMIN_API_UNAVAILABLE", message: "Admin service is temporarily unavailable" } }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
